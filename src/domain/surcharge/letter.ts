import type { AuditInput, AuditResult } from './audit.js';

/** English dispute letter for all flagged lines. Placeholders stay visible. */
export function disputeLetter(input: AuditInput, result: AuditResult, today: string): string | undefined {
  const flagged = result.lines.filter((l) => l.status === 'flag');
  if (!flagged.length) return undefined;
  const rows = flagged
    .map((l) => `- ${l.label}: charged USD ${l.charged.toFixed(2)}${l.expected !== undefined ? `, expected USD ${l.expected.toFixed(2)}` : ''}. ${l.findings[0] ?? ''}`)
    .join('\n');
  return [
    '[Your company]', '[Address]', '', `To: ${input.carrier} / [forwarder], billing / claims department`, '', today, '',
    'Subject: Dispute of surcharges – Invoice [invoice no.], Booking [booking no.]', '',
    'Dear Sir or Madam,', '',
    `we dispute the following charges on the above invoice for the shipment ${input.originCountry} → ${input.destinationCountry} (booking date ${input.bookingDate}${input.sailingDate ? `, sailing ${input.sailingDate}` : ''}):`, '',
    rows, '',
    `Disputed amount: USD ${result.totalOverchargeUsd.toFixed(2)}.`, '',
    'Please provide the advisory (date, scope, amount) on which each disputed charge is based, or issue a credit note for the disputed amount. We will pay all undisputed charges on time. This dispute is raised within the applicable claim period and without prejudice to our further rights.', '',
    'Kind regards', '', '[Name]',
  ].join('\n');
}
