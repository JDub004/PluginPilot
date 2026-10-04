import { classify } from './categories.js';
import { CO2_LAW_START, landlordCo2Percent } from './co2.js';
import type { CheckResult, Finding, Statement } from './schema.js';

export const RULES_VERSION = '2026.10.0';

export const DISCLAIMER =
  'Automatische, regelbasierte Prüfung nach BGB, BetrKV, HeizkostenV und CO2KostAufG. Keine Rechtsberatung. ' +
  'Bei Streit oder hohen Beträgen: Mieterverein oder Anwalt für Mietrecht.';

const CABLE_TV_CUTOFF = '2024-07-01';

// --- date helpers (UTC, ISO YYYY-MM-DD) --------------------------------------------------

function parse(d: string): Date {
  const parsed = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new InvalidStatementError(`Ungültiges Datum: ${d}`);
  return parsed;
}
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const DAY = 86_400_000;

/** Last day of the month that is `months` months after the month of `d`. */
export function endOfMonthAfter(d: string, months: number): string {
  const x = parse(d);
  return fmt(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + months + 1, 0)));
}

function addMonthsMinusOneDay(d: string, months: number): string {
  const x = parse(d);
  const target = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + months, x.getUTCDate()));
  return fmt(new Date(target.getTime() - DAY));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export class InvalidStatementError extends Error {}

// --- rules -------------------------------------------------------------------------------

export const CHECKED_RULES = [
  'Abrechnungszeitraum max. 12 Monate (§ 556 Abs. 3 S. 1 BGB)',
  'Abrechnungsfrist 12 Monate nach Periodenende (§ 556 Abs. 3 S. 2-3 BGB)',
  'Einwendungsfrist des Mieters (§ 556 Abs. 3 S. 5 BGB)',
  'Umlagefähigkeit jeder Position (§ 2 BetrKV, § 1 Abs. 2 BetrKV)',
  'Ende der Umlage von Kabel-TV zum 01.07.2024',
  'Rechenprüfung Verteilerschlüssel je Position',
  'Wohnfläche im Flächenschlüssel',
  'Summe, Vorauszahlungen und Saldo',
  'Verbrauchsanteil Heizung/Warmwasser 50-70 % (§§ 7, 8 HeizkostenV)',
  'Kürzungsrecht 15 % bei nicht verbrauchsabhängiger Abrechnung (§ 12 HeizkostenV)',
  'CO2-Kostenaufteilung nach Stufenmodell (CO2KostAufG)',
];

export function checkStatement(s: Statement): CheckResult {
  if (parse(s.periodEnd) < parse(s.periodStart)) {
    throw new InvalidStatementError('periodEnd liegt vor periodStart.');
  }
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f.estimatedOverchargeEur !== undefined ? { ...f, estimatedOverchargeEur: round2(f.estimatedOverchargeEur) } : f);

  // 1. Period length
  const maxEnd = addMonthsMinusOneDay(s.periodStart, 12);
  if (s.periodEnd > maxEnd) {
    add({
      id: 'period-too-long',
      severity: 'error',
      title: 'Abrechnungszeitraum länger als 12 Monate',
      explanation: `Der Zeitraum ${s.periodStart} bis ${s.periodEnd} überschreitet 12 Monate. Über Betriebskosten ist jährlich abzurechnen; die Abrechnung ist formell angreifbar.`,
      legalBasis: '§ 556 Abs. 3 S. 1 BGB',
    });
  }

  // 2. Billing deadline
  const billingDeadline = endOfMonthAfter(s.periodEnd, 12);
  const balance = s.statedBalance;
  if (s.receivedDate && s.receivedDate > billingDeadline) {
    add({
      id: 'statement-late',
      severity: balance !== undefined && balance > 0 ? 'error' : 'warning',
      title: 'Abrechnung verspätet zugegangen',
      explanation:
        `Die Abrechnung hätte bis ${billingDeadline} zugehen müssen, kam aber am ${s.receivedDate}. ` +
        'Eine Nachforderung ist dann ausgeschlossen, es sei denn, der Vermieter hat die Verspätung nicht zu vertreten. Ein Guthaben muss trotzdem ausgezahlt werden.',
      legalBasis: '§ 556 Abs. 3 S. 2-3 BGB',
      ...(balance !== undefined && balance > 0 ? { estimatedOverchargeEur: balance } : {}),
    });
  }

  // 3. Item classification and arithmetic
  let heatingTenantTotal = 0;
  for (const item of s.items) {
    const cat = classify(item.label);
    if (cat.kind === 'not_allocable') {
      add({
        id: `not-allocable:${cat.code}`,
        severity: 'error',
        title: `Nicht umlagefähig: ${item.label}`,
        explanation: `${cat.reason} Ihnen wurden ${eur(item.tenantShare)} berechnet.`,
        legalBasis: '§ 1 Abs. 2 BetrKV',
        item: item.label,
        estimatedOverchargeEur: Math.max(0, item.tenantShare),
      });
    } else if (cat.kind === 'unknown') {
      add({
        id: 'unknown-item',
        severity: 'warning',
        title: `Unklare Position: ${item.label}`,
        explanation:
          'Diese Position lässt sich keiner Betriebskostenart nach § 2 BetrKV eindeutig zuordnen. Umlagefähig ist sie nur, wenn sie eine Betriebskostenart ist und im Mietvertrag vereinbart wurde. Belege einsehen.',
        legalBasis: '§ 2 BetrKV, § 556 Abs. 1 BGB',
        item: item.label,
      });
    } else {
      if (cat.code === '4' || cat.code === '5') heatingTenantTotal += item.tenantShare;
      if (cat.code === '17') {
        add({
          id: 'other-costs-need-contract',
          severity: 'info',
          title: `„Sonstige Betriebskosten“: ${item.label}`,
          explanation: 'Sonstige Betriebskosten sind nur umlagefähig, wenn sie im Mietvertrag einzeln benannt sind. Bitte im Vertrag prüfen.',
          legalBasis: '§ 2 Nr. 17 BetrKV',
          item: item.label,
        });
      }
      if (cat.code === '15' && s.periodEnd >= CABLE_TV_CUTOFF) {
        const start = parse(s.periodStart > CABLE_TV_CUTOFF ? s.periodStart : CABLE_TV_CUTOFF).getTime();
        const end = parse(s.periodEnd).getTime();
        const total = end - parse(s.periodStart).getTime() + DAY;
        const share = Math.max(0, (end - start + DAY) / total);
        add({
          id: 'cable-tv-after-2024',
          severity: 'error',
          title: `Kabel-TV seit 01.07.2024 nicht mehr umlagefähig: ${item.label}`,
          explanation:
            'Seit dem 01.07.2024 dürfen Kosten für Kabelfernsehen (Gemeinschaftsantenne/Breitbandnetz) nicht mehr über die Nebenkosten abgerechnet werden. Ausnahme: ein gesondert vereinbartes Glasfaser-Bereitstellungsentgelt.',
          legalBasis: 'Ende des Nebenkostenprivilegs (TKG-Novelle, Übergangsfrist bis 30.06.2024)',
          item: item.label,
          estimatedOverchargeEur: Math.max(0, item.tenantShare * share),
        });
      }
    }

    // Arithmetic of the allocation key
    if (item.totalCost !== undefined && item.totalAllocationUnits && item.tenantAllocationUnits) {
      const expected = (item.totalCost * item.tenantAllocationUnits) / item.totalAllocationUnits;
      const diff = item.tenantShare - expected;
      const tolerance = Math.max(1, Math.abs(expected) * 0.01);
      if (diff > tolerance) {
        add({
          id: 'allocation-math',
          severity: 'error',
          title: `Rechenfehler bei ${item.label}`,
          explanation: `${eur(item.totalCost)} × ${item.tenantAllocationUnits} / ${item.totalAllocationUnits} = ${eur(expected)}. Berechnet wurden ${eur(item.tenantShare)}.`,
          legalBasis: '§ 556a BGB (Abrechnungsmaßstab)',
          item: item.label,
          estimatedOverchargeEur: diff,
        });
      } else if (diff < -tolerance) {
        add({
          id: 'allocation-math-in-favour',
          severity: 'info',
          title: `Abweichung zu Ihren Gunsten bei ${item.label}`,
          explanation: `Nach Schlüssel wären ${eur(expected)} statt ${eur(item.tenantShare)} angefallen.`,
          item: item.label,
        });
      }
    }

    // Wrong living area in area key
    if (item.allocationKey === 'area' && s.apartmentSqm && item.tenantAllocationUnits) {
      const ratio = item.tenantAllocationUnits / s.apartmentSqm;
      if (ratio > 1.01) {
        add({
          id: 'area-mismatch',
          severity: 'warning',
          title: `Zu große Wohnfläche angesetzt bei ${item.label}`,
          explanation: `Angesetzt: ${item.tenantAllocationUnits} m², Ihre Wohnfläche: ${s.apartmentSqm} m². Maßgeblich ist die tatsächliche Wohnfläche.`,
          legalBasis: '§ 556a Abs. 1 BGB',
          item: item.label,
          estimatedOverchargeEur: item.tenantShare * (1 - 1 / ratio),
        });
      }
    }
  }

  // 4. Totals
  if (s.prepaymentsTotal !== undefined && balance !== undefined) {
    const sum = s.items.reduce((acc, i) => acc + i.tenantShare, 0);
    const expectedBalance = sum - s.prepaymentsTotal;
    const diff = balance - expectedBalance;
    if (Math.abs(diff) > 1) {
      add({
        id: 'balance-mismatch',
        severity: diff > 0 ? 'error' : 'info',
        title: 'Saldo stimmt nicht mit den Einzelpositionen überein',
        explanation: `Summe der Positionen ${eur(sum)} minus Vorauszahlungen ${eur(s.prepaymentsTotal)} = ${eur(expectedBalance)}. Ausgewiesen: ${eur(balance)}.`,
        ...(diff > 0 ? { estimatedOverchargeEur: diff } : {}),
      });
    }
  }

  // 5. Heating
  const h = s.heating;
  if (h) {
    if (h.consumptionSharePercent !== undefined && (h.consumptionSharePercent < 50 || h.consumptionSharePercent > 70)) {
      add({
        id: 'heating-consumption-share',
        severity: 'error',
        title: 'Verbrauchsanteil der Heizkosten unzulässig',
        explanation: `Mindestens 50 % und höchstens 70 % der Heiz- und Warmwasserkosten sind nach Verbrauch zu verteilen. Angesetzt: ${h.consumptionSharePercent} %.`,
        legalBasis: '§§ 7 Abs. 1, 8 Abs. 1 HeizkostenV',
      });
    }
    if (h.billedByConsumption === false && heatingTenantTotal > 0) {
      add({
        id: 'heating-not-by-consumption',
        severity: 'error',
        title: 'Heizkosten nicht verbrauchsabhängig abgerechnet',
        explanation: 'Wird entgegen der HeizkostenV nicht nach Verbrauch abgerechnet, dürfen Sie Ihren Heizkostenanteil um 15 % kürzen.',
        legalBasis: '§ 12 Abs. 1 HeizkostenV',
        estimatedOverchargeEur: heatingTenantTotal * 0.15,
      });
    }
    if (h.fossilFuel && s.periodStart >= CO2_LAW_START) {
      if (h.co2InfoShown === false) {
        add({
          id: 'co2-info-missing',
          severity: 'warning',
          title: 'CO2-Kosten und -Ausstoß fehlen in der Abrechnung',
          explanation:
            'Bei fossiler Heizung muss die Abrechnung CO2-Kosten, Emissionen und die Aufteilung zwischen Mieter und Vermieter ausweisen. Fehlt das, dürfen Sie Ihren Heizkostenanteil um 3 % kürzen.',
          legalBasis: '§ 7 Abs. 3-4 CO2KostAufG',
          ...(heatingTenantTotal > 0 ? { estimatedOverchargeEur: heatingTenantTotal * 0.03 } : {}),
        });
      }
      if (h.co2KgPerSqmYear !== undefined) {
        const pct = landlordCo2Percent(h.co2KgPerSqmYear);
        if (h.tenantCo2CostShareBeforeSplit !== undefined) {
          const expectedLandlord = (h.tenantCo2CostShareBeforeSplit * pct) / 100;
          const applied = h.co2LandlordShareApplied ?? 0;
          if (expectedLandlord - applied > 1) {
            add({
              id: 'co2-split',
              severity: 'error',
              title: 'Vermieteranteil an den CO2-Kosten zu niedrig',
              explanation: `Bei ${h.co2KgPerSqmYear} kg CO2/m²/Jahr trägt der Vermieter ${pct} % der CO2-Kosten: ${eur(expectedLandlord)} von ${eur(h.tenantCo2CostShareBeforeSplit)}. Berücksichtigt: ${eur(applied)}.`,
              legalBasis: '§ 5 CO2KostAufG mit Anlage (Stufenmodell)',
              estimatedOverchargeEur: expectedLandlord - applied,
            });
          }
        } else {
          add({
            id: 'co2-stage',
            severity: 'info',
            title: `CO2-Stufe: Vermieter trägt ${pct} %`,
            explanation: `Bei ${h.co2KgPerSqmYear} kg CO2/m²/Jahr muss der Vermieter ${pct} % der auf Ihre Wohnung entfallenden CO2-Kosten tragen. Prüfen Sie, ob das in der Abrechnung abgezogen wurde.`,
            legalBasis: '§ 5 CO2KostAufG mit Anlage',
          });
        }
      }
    }
  }

  // 6. Objection deadline and cost per m²
  const objectionDeadline = s.receivedDate ? endOfMonthAfter(s.receivedDate, 12) : undefined;
  if (s.apartmentSqm) {
    const months = Math.max(1, Math.round((parse(s.periodEnd).getTime() - parse(s.periodStart).getTime() + DAY) / (DAY * 30.4375)));
    const total = s.items.reduce((acc, i) => acc + i.tenantShare, 0);
    add({
      id: 'cost-per-sqm',
      severity: 'info',
      title: `Ihre Nebenkosten: ${eur(total / s.apartmentSqm / months)} pro m² und Monat`,
      explanation: 'Zum Vergleich eignet sich der Betriebskostenspiegel des Deutschen Mieterbunds für Ihre Region.',
    });
  }

  const estimatedOverchargeEur = round2(findings.reduce((acc, f) => acc + (f.estimatedOverchargeEur ?? 0), 0));
  const hasError = findings.some((f) => f.severity === 'error');
  const hasWarning = findings.some((f) => f.severity === 'warning');
  return {
    rulesVersion: RULES_VERSION,
    verdict: hasError ? 'issues_found' : hasWarning ? 'warnings_only' : 'no_issues_found',
    estimatedOverchargeEur,
    ...(objectionDeadline ? { objectionDeadline } : {}),
    findings,
    checkedRules: CHECKED_RULES,
    disclaimer: DISCLAIMER,
  };
}
