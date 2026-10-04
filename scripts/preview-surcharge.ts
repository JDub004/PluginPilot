// Standalone preview of the Surcharge Check widget with an example invoice.
// Usage: npx tsx scripts/preview-surcharge.ts <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { AuditInputSchema, auditSurcharges } from '../src/domain/surcharge/audit.js';

const input = AuditInputSchema.parse({
  carrier: 'Maersk', originCountry: 'DE', destinationCountry: 'OM', bookingDate: '2026-03-03', sailingDate: '2026-03-05',
  lines: [
    { label: 'Emergency Contingency Surcharge', amountUsd: 6000, containerType: '40HC', quantity: 2 },
    { label: 'Emergency Bunker Surcharge', amountUsd: 900, containerType: '40HC', quantity: 2 },
    { label: 'War Risk Surcharge', amountUsd: 3000, containerType: '40HC', quantity: 2 },
    { label: 'BAF', amountUsd: 1240, containerType: '40HC', quantity: 2 },
    { label: 'Terminal Handling Charge (origin)', amountUsd: 560, containerType: '40HC', quantity: 2 },
  ],
});
const result = auditSurcharges(input);
const html = readFileSync(new URL('../web/src/surcharge.html', import.meta.url), 'utf8').replace(
  '<script>',
  `<script>window.openai = { toolOutput: ${JSON.stringify(result).replaceAll('<', '\\u003c')} };</script>\n<script>`,
);
writeFileSync(process.argv[2] ?? 'surcharge-preview.html', html);
console.log(result.verdict, result.totalOverchargeUsd, result.lines.map((l) => `${l.code}:${l.status}`).join(' '));
