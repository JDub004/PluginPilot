// Standalone preview of the Software-Stadt widget with the sample company.
// Usage: npx tsx scripts/preview-city.ts <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { buildCity } from '../src/domain/softwarecity/build.js';
import { inventoryCsv, renderReport } from '../src/domain/softwarecity/report.js';
import { SAMPLE_COMPANY } from '../src/domain/softwarecity/sample.js';
import { CityInputSchema } from '../src/domain/softwarecity/schema.js';

const city = buildCity(CityInputSchema.parse({ ...SAMPLE_COMPANY, preparedBy: 'RheinNet IT', brandColor: '#0a84ff' }), { today: new Date().toISOString().slice(0, 10) });
Object.assign(city, { inventoryCsv: inventoryCsv(city), report: renderReport(city) });
const html = readFileSync(new URL('../web/src/city.html', import.meta.url), 'utf8').replace(
  '<script>',
  `<script>window.__CITY__ = ${JSON.stringify(city).replaceAll('<', '\\u003c')};</script>\n<script>`,
);
writeFileSync(process.argv[2] ?? 'city-preview.html', html);
