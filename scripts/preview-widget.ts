// Builds a standalone preview of the timeline widget with an example plan (no ChatGPT needed).
// Usage: npx tsx scripts/preview-widget.ts <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { planAfterDeath } from '../src/domain/trauerfall/plan.js';
import { SituationSchema } from '../src/domain/trauerfall/schema.js';

const plan = planAfterDeath(
  SituationSchema.parse({
    dateOfDeath: '2026-09-28', relationship: 'spouse_or_partner', survivingSpouse: true, survivingSpouseFamilyInsured: true,
    deceasedReceivedPension: true, rentedApartment: true, livedTogether: true, ownedVehicle: true, hasLifeInsurance: true,
    placeOfDeath: 'hospital_or_care_home',
  }),
  '2026-10-04',
);
const html = readFileSync(new URL('../web/src/timeline.html', import.meta.url), 'utf8').replace(
  '<script>',
  `<script>window.openai = { toolOutput: ${JSON.stringify(plan).replaceAll('<', '\\u003c')} };</script>\n<script>`,
);
writeFileSync(process.argv[2] ?? 'preview.html', html);
