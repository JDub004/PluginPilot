import { z } from 'zod';
import { ANNOUNCEMENTS, type Announcement, type ContainerType, type SurchargeCode } from './announcements.js';

export const DB_VERSION = '2026-10-04';

const iso2 = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2 country code, e.g. DE, CN, AE');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const AuditInputSchema = z
  .object({
    carrier: z.string().trim().min(2).max(40).describe('Ocean carrier, e.g. "Maersk", "Hapag-Lloyd", "CMA CGM", "MSC"'),
    originCountry: iso2.describe('Country of the port of loading'),
    destinationCountry: iso2.describe('Country of the port of discharge'),
    bookingDate: isoDate.describe('Date the booking was issued/confirmed'),
    sailingDate: isoDate.optional().describe('Actual or planned departure from the port of loading'),
    gateInDate: isoDate.optional().describe('Date the full container was delivered to the loading terminal (some carriers price by gate-in)'),
    headhaul: z.boolean().default(true).describe('false for backhaul/intra-region trades (affects emergency bunker amounts)'),
    fixedAllInRate: z.boolean().default(false).describe('true if the contract/quote states an all-in rate including surcharges'),
    lines: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(120).describe('Charge line as printed, e.g. "WRS", "Emergency Conflict Surcharge"'),
          amountUsd: z.number().finite().min(0).max(1_000_000).describe('Total amount of this line in USD'),
          containerType: z.enum(['20DV', '40DV', '40HC', '45HC', '20RF', '40RF', 'SPECIAL']).describe('20DV/40DV/40HC dry, 20RF/40RF reefer'),
          quantity: z.number().int().min(1).max(500).default(1),
        }),
      )
      .min(1)
      .max(40),
  })
  .strict();
export type AuditInput = z.infer<typeof AuditInputSchema>;

export type LineStatus = 'ok' | 'check' | 'flag';
export interface LineResult {
  label: string;
  code: SurchargeCode | 'BAF' | 'GRI' | 'PSS' | 'THC' | 'OTHER';
  status: LineStatus;
  charged: number;
  expected?: number;
  overchargeUsd: number;
  findings: string[];
  announcementId?: string;
  source?: string;
  sourceConfidence?: 'primary' | 'secondary';
}

const US_REGULATED = new Set(['US', 'PR', 'GU', 'AS', 'VI', 'MP']);

export function classify(label: string): LineResult['code'] {
  const l = label.toLowerCase();
  if (/\bwrs\b|war.?risk/.test(l)) return 'WRS';
  if (/\becs\b|\bems\b|emergency (conflict|contingency)|conflict surcharge|contingency surcharge|^emergency surcharge/.test(l)) return 'ECS';
  if (/\bebs\b|\befs\b|emergency (bunker|fuel)/.test(l)) return 'EBS';
  if (/\bocr\b|operational cost recovery/.test(l)) return 'OCR';
  if (/\bbaf\b|bunker adjustment|fuel surcharge|\blss\b|low sulphur/.test(l)) return 'BAF';
  if (/\bgri\b|general rate increase/.test(l)) return 'GRI';
  if (/\bpss\b|peak season/.test(l)) return 'PSS';
  if (/\bthc\b|terminal handling/.test(l)) return 'THC';
  return 'OTHER';
}

function normCarrier(c: string): Announcement['carrier'] | undefined {
  const x = c.toLowerCase().replace(/[^a-z]/g, '');
  if (x.startsWith('hapag')) return 'HAPAG-LLOYD';
  if (x.startsWith('cma')) return 'CMA CGM';
  if (x.startsWith('maersk')) return 'MAERSK';
  if (x.startsWith('msc') || x.includes('mediterraneanshipping')) return 'MSC';
  if (x === 'one' || x.startsWith('oceannetwork')) return 'ONE';
  return undefined;
}

function inScope(a: Announcement, o: string, d: string): boolean {
  if (a.global) return true;
  if (a.originExcludedCountries?.includes(o)) return false;
  if (a.originCountries && !a.originCountries.includes(o)) return false;
  if (a.destinationCountries && !a.destinationCountries.includes(d)) return false;
  if (a.countries && !(a.countries.includes(o) || a.countries.includes(d))) return false;
  return true;
}

const usd = (n: number) => `USD ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export interface AuditResult {
  dbVersion: string;
  carrierKnown: boolean;
  usRegulatedTrade: boolean;
  totalCharged: number;
  totalOverchargeUsd: number;
  verdict: 'dispute_recommended' | 'clarify' | 'no_issues_found';
  lines: LineResult[];
  nextSteps: string[];
  disclaimer: string;
}

export function auditSurcharges(input: AuditInput): AuditResult {
  const carrier = normCarrier(input.carrier);
  const o = input.originCountry;
  const d = input.destinationCountry;
  const usRegulated = US_REGULATED.has(o) || US_REGULATED.has(d);
  const seen = new Map<string, number>();
  const lines: LineResult[] = [];

  for (const line of input.lines) {
    const code = classify(line.label);
    const r: LineResult = { label: line.label, code, status: 'ok', charged: line.amountUsd, overchargeUsd: 0, findings: [] };
    seen.set(code, (seen.get(code) ?? 0) + 1);

    if (code === 'OTHER' || code === 'THC') {
      r.status = 'check';
      r.findings.push('Not an emergency surcharge covered by the database. Compare with your quote and the carrier tariff.');
      lines.push(r);
      continue;
    }
    if (input.fixedAllInRate && code !== 'BAF') {
      r.status = 'flag';
      r.overchargeUsd = line.amountUsd;
      r.findings.push('Your quote/contract states an all-in rate. Ask the carrier/forwarder which clause allows adding this surcharge.');
    }
    if (code === 'BAF' || code === 'GRI' || code === 'PSS') {
      if (r.status === 'ok') r.findings.push('Regular surcharge type. Check the amount against your contract or quote.');
      lines.push(r);
      continue;
    }
    if (!carrier) {
      r.status = r.status === 'flag' ? 'flag' : 'check';
      r.findings.push('Carrier not in the database yet. Ask for the carrier advisory (name, date, scope, amount) that this charge is based on.');
      lines.push(r);
      continue;
    }

    const candidates = ANNOUNCEMENTS.filter((a) => a.carrier === carrier && a.code === code);
    const match = candidates.find((a) => inScope(a, o, d));
    if (!match) {
      if (candidates.length) {
        // The carrier announced this surcharge type, but its scope excludes the lane.
        r.status = 'flag';
        r.overchargeUsd = line.amountUsd;
        r.findings.push(`No ${carrier} ${code} announcement covers ${o}→${d}. The announced scope does not include this lane.`);
      } else {
        // Our database may be incomplete: absence is not proof. Ask, don't accuse.
        if (r.status !== 'flag') r.status = 'check';
        r.findings.push(`No ${carrier} announcement for a ${code}-type surcharge in our database yet. Ask the carrier for the advisory (date, scope, amount) it is based on.`);
      }
      if (candidates[0]) { r.source = candidates[0].source; r.sourceConfidence = candidates[0].confidence; }
      lines.push(r);
      continue;
    }

    r.announcementId = match.id;
    r.source = match.source;
    r.sourceConfidence = match.confidence;
    const effective = usRegulated && match.effectiveUsRegulated ? match.effectiveUsRegulated : match.effective;
    const gateIn = match.priceBasis === 'gate_in';
    if (gateIn && !input.gateInDate) {
      if (r.status === 'ok') r.status = 'check';
      r.findings.push(`${carrier} applies this surcharge by gate-in date (from ${effective}). Add the gate-in date to check the timing.`);
    }
    const priceDate = gateIn ? input.gateInDate ?? '9999-12-31' : input.bookingDate;
    const dateWord = gateIn ? 'Gate-in' : 'Booked';

    // Timing
    if (priceDate < effective) {
      const departedBefore = input.sailingDate !== undefined && input.sailingDate < effective;
      if (match.appliesToCargoAfloat === false && (departedBefore || input.sailingDate === undefined)) {
        r.status = 'flag';
        r.overchargeUsd = line.amountUsd;
        r.findings.push(`${dateWord} ${priceDate}, before the effective date ${effective}${usRegulated && match.effectiveUsRegulated ? ' (later date for FMC-regulated US trades)' : ''}. The carrier states cargo in transit is not impacted.`);
      } else if (match.appliesToCargoAfloat === true) {
        r.status = r.status === 'flag' ? 'flag' : 'check';
        r.findings.push(`Booked before the effective date ${effective}, but the carrier announced that the surcharge also applies to cargo already afloat. Check whether your contract or national rules exclude this (some regulators stopped it for cargo in transit).`);
      } else if (departedBefore) {
        r.status = 'flag';
        r.overchargeUsd = line.amountUsd;
        r.findings.push(`${dateWord} ${priceDate} and sailed ${input.sailingDate}, both before the effective date ${effective}.`);
      } else {
        r.status = r.status === 'flag' ? 'flag' : 'check';
        r.findings.push(`Booked before the effective date ${effective}. Ask on which date (booking, gate-in, sailing) the carrier calculates the price.`);
      }
    }

    // Amount
    const table = !input.headhaul && match.backhaulAmounts ? match.backhaulAmounts : match.amounts;
    const unit = table[line.containerType];
    if (Object.keys(table).length === 0) {
      if (r.status === 'ok') r.status = 'check';
      r.findings.push('The carrier advisory does not state an amount. Ask for the tariff amount behind this charge.');
    } else if (unit !== undefined) {
      const expected = unit * line.quantity;
      r.expected = expected;
      const diff = line.amountUsd - expected;
      if (diff > Math.max(1, expected * 0.01)) {
        r.status = 'flag';
        r.overchargeUsd = Math.max(r.overchargeUsd, diff);
        r.findings.push(`Charged ${usd(line.amountUsd)}; announced ${usd(unit)} × ${line.quantity} = ${usd(expected)}.`);
      }
    } else {
      r.status = r.status === 'flag' ? 'flag' : 'check';
      r.findings.push(`No announced amount for ${line.containerType}.`);
    }
    if (match.confidence === 'secondary') {
      if (r.status === 'ok') r.status = 'check';
      r.findings.push('Database entry is based on trade press; confirm with the carrier advisory before relying on it.');
    }
    if (r.findings.length === 0) r.findings.push(`Matches ${match.name} (${usd(r.expected ?? 0)}, effective ${effective}).`);
    lines.push(r);
  }

  const firstOfCode = new Set<string>();
  for (const r of lines) {
    if ((seen.get(r.code) ?? 0) > 1 && r.code !== 'OTHER' && r.code !== 'THC') {
      r.status = 'flag';
      r.findings.push(`Charged ${seen.get(r.code)} times as ${r.code}. Possible duplicate.`);
      // The first occurrence may be legitimate; every repeat is disputable in full.
      if (firstOfCode.has(r.code)) r.overchargeUsd = Math.max(r.overchargeUsd, r.charged);
      firstOfCode.add(r.code);
    }
  }

  const totalOverchargeUsd = Math.round(lines.reduce((a, l) => a + l.overchargeUsd, 0) * 100) / 100;
  const flagged = lines.some((l) => l.status === 'flag');
  const checks = lines.some((l) => l.status === 'check');
  return {
    dbVersion: DB_VERSION,
    carrierKnown: carrier !== undefined,
    usRegulatedTrade: usRegulated,
    totalCharged: lines.reduce((a, l) => a + l.charged, 0),
    totalOverchargeUsd,
    verdict: flagged ? 'dispute_recommended' : checks ? 'clarify' : 'no_issues_found',
    lines,
    nextSteps: flagged
      ? [
          'Dispute in writing now, quoting invoice number, booking number and each flagged line.',
          'Check the claim/dispute window in your contract, quote or bill of lading terms. Disputes are usually lost on missed deadlines, not on merit.',
          'Ask for the carrier advisory (date, scope, amount) behind every disputed surcharge.',
          'Pay undisputed lines on time so the cargo is not held.',
        ]
      : ['Keep the invoice and the carrier advisories on file. Re-run the check if new surcharges appear.'],
    disclaimer:
      `Automated check against a curated announcement database (version ${DB_VERSION}). Carriers update surcharges often; entries marked "secondary" come from trade press. Not legal advice.`,
  };
}
