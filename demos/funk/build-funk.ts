// Funk demo: public facts (sites) + clearly marked placeholders. Not part of the repo.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildCity } from '../../src/domain/softwarecity/build.js';
import { locate } from '../../src/domain/softwarecity/geo.js';
import { inventoryCsv, renderReport } from '../../src/domain/softwarecity/report.js';
import { CityInputSchema } from '../../src/domain/softwarecity/schema.js';

const NL = ['Berlin', 'Bielefeld', 'Dresden', 'Düsseldorf', 'Erfurt', 'Frankfurt', 'Freiburg', 'Hannover', 'Köln', 'Leipzig', 'München', 'Nürnberg', 'Regensburg', 'Stuttgart'];
const ABROAD: [string, string, string][] = [['Wien', 'Österreich', 'Funk Österreich'], ['Zürich', 'Schweiz', 'Funk Schweiz'], ['Vaduz', 'Liechtenstein', 'Funk Liechtenstein'],
  ['Amsterdam', 'Niederlande', 'Funk Niederlande'], ['Mailand', 'Italien', 'Funk Italien'], ['Budapest', 'Ungarn', 'Funk Ungarn'], ['Warschau', 'Polen', 'Funk Polen'],
  ['Bukarest', 'Rumänien', 'Funk Rumänien'], ['Shanghai', 'China', 'Funk China']];
const contact = 'NL-Leitung (Name eintragen)';
const sites = [
  { name: 'Zentrale Hamburg', city: 'Hamburg', country: 'Deutschland', main: true, contact: 'Geschäftsführung (Name eintragen)', role: 'Zentrale' },
  ...NL.map((c) => ({ name: `NL ${c}`, city: c, country: 'Deutschland', main: false, contact, role: 'Niederlassungsleitung' })),
  ...ABROAD.map(([c, land, n]) => ({ name: n, city: c, country: land, main: false, contact: 'Landesleitung (Name eintragen)', role: 'Landesgesellschaft', note: 'Stadt angenommen, bitte prüfen' })),
];

const A = (name: string, category: string, department: string, users: number, importance: number, o: Record<string, unknown> = {}) =>
  ({ name, category, department, users, importance, critical: importance >= 4, approved: true, dataFlowsTo: [], ...o });
const apps = [
  A('Microsoft 365', 'collaboration', 'Alle', 1500, 5, { owner: 'IT-Leitung', dataFlowsTo: ['SharePoint'] }),
  A('Microsoft Teams', 'communication', 'Alle', 1500, 4, { owner: 'IT-Leitung' }),
  A('SharePoint', 'storage', 'Alle', 1400, 4, { owner: 'IT-Leitung' }),
  A('Maklerverwaltung (Bestand & Verträge)', 'erp', 'Alle', 1100, 5, { owner: 'IT-Leitung', dataFlowsTo: ['Versicherer-Schnittstellen (BiPRO)', 'Dokumentenmanagement', 'Finanzbuchhaltung'] }),
  A('Versicherer-Schnittstellen (BiPRO)', 'other', 'Alle', 40, 5, { owner: 'IT-Leitung' }),
  A('Dokumentenmanagement', 'storage', 'Alle', 1200, 4, { owner: 'IT-Leitung' }),
  A('CRM Kundenbetreuung', 'crm', 'Kundenbetreuung', 600, 4, { owner: 'Leitung Vertrieb', dataFlowsTo: ['Maklerverwaltung (Bestand & Verträge)'] }),
  A('Angebots- und Ausschreibungstool', 'crm', 'Kundenbetreuung', 150, 3),
  A('Schadenmanagement-System', 'support', 'Schadenmanagement', 300, 5, { owner: 'Leitung Schaden', dataFlowsTo: ['Maklerverwaltung (Bestand & Verträge)'] }),
  A('Schadenmeldungs-Portal (Kunden)', 'ecommerce', 'Schadenmanagement', 80, 4, { owner: 'Leitung Schaden', dataFlowsTo: ['Schadenmanagement-System'] }),
  A('Risikoanalyse & Risk Engineering', 'analytics', 'Risk & Sparten', 120, 4),
  A('Cyber-Risiko-Fragebogen', 'spreadsheet', 'Risk & Sparten', 40, 3, { critical: false }),
  A('Kundenliste Großrisiken.xlsx', 'spreadsheet', 'Risk & Sparten', 25, 4),
  A('bAV-Verwaltung', 'hr', 'Personenversicherung & bAV', 90, 4, { owner: 'Leitung bAV' }),
  A('Funk Alliance Portal', 'collaboration', 'Funk Alliance', 120, 4, { owner: 'Leitung International' }),
  A('Internationale Programme (Master-Policen)', 'erp', 'Funk Alliance', 60, 4),
  A('Finanzbuchhaltung', 'accounting', 'Finanzen', 60, 5, { owner: 'Leitung Finanzen' }),
  A('Provisionsabrechnung', 'accounting', 'Finanzen', 30, 4, { dataFlowsTo: ['Finanzbuchhaltung'] }),
  A('Personalsoftware & Lohn', 'hr', 'Personal', 25, 4, { owner: 'Leitung Personal', dataFlowsTo: ['Finanzbuchhaltung'] }),
  A('Lernplattform (Weiterbildung IDD)', 'hr', 'Personal', 1500, 3),
  A('IT-Service-Desk', 'support', 'IT', 60, 4, { owner: 'IT-Leitung' }),
  A('Endpoint- & Identitätsschutz', 'security', 'IT', 20, 5, { owner: 'IT-Leitung' }),
  A('Passwortmanager', 'security', 'Alle', 1400, 4),
  A('Website & CMS', 'marketing', 'Marketing & Kommunikation', 15, 3, { owner: 'Leitung Marketing' }),
  A('Newsletter-Tool', 'marketing', 'Marketing & Kommunikation', 8, 2),
  A('Vertragsmanagement Recht', 'other', 'Recht & Compliance', 20, 4),
  A('Management-Reporting (BI)', 'analytics', 'Geschäftsführung', 40, 4, { dataFlowsTo: ['Maklerverwaltung (Bestand & Verträge)', 'Finanzbuchhaltung'] }),
];

const ALLIANCE = ['London', 'Paris', 'Madrid', 'Lissabon', 'Brüssel', 'Luxemburg', 'Kopenhagen', 'Stockholm', 'Oslo', 'Helsinki', 'Dublin', 'Athen', 'Prag', 'Bratislava',
  'Ljubljana', 'Zagreb', 'Belgrad', 'Sofia', 'Riga', 'Vilnius', 'Tallinn', 'Kiew', 'Istanbul', 'Tel Aviv', 'Kairo', 'Casablanca', 'Lagos', 'Nairobi', 'Johannesburg', 'Dubai',
  'Riad', 'Mumbai', 'Delhi', 'Singapur', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Hongkong', 'Seoul', 'Tokio', 'Sydney', 'Auckland', 'New York', 'Chicago', 'Houston',
  'Toronto', 'Mexiko-Stadt', 'Bogota', 'Lima', 'Santiago', 'Buenos Aires', 'Sao Paulo'];
const BR = ['Maschinenbau', 'Logistik', 'Handel', 'Bau', 'Lebensmittel', 'Automotive', 'Energie', 'Chemie', 'Gesundheit', 'Kommune'];
const partners = [
  ...ALLIANCE.map((c) => ({ name: `Alliance-Partner ${c}`, kind: 'alliance', city: c, note: 'Platzhalter, echten Partner eintragen' })),
  ...['Hamburg', ...NL].flatMap((c, i) => Array.from({ length: 8 }, (_, k) => {
    const g = locate(c)!, a = ((i * 8 + k) * 2.39996) % (2 * Math.PI), r = 0.08 + ((k * 37) % 10) / 40;
    return { name: `Musterkunde ${BR[(i + k) % BR.length]} ${c} ${k + 1}`, kind: 'customer', industry: BR[(i + k) % BR.length], site: c === 'Hamburg' ? 'Zentrale Hamburg' : `NL ${c}`,
      lat: +(g.lat + Math.sin(a) * r).toFixed(3), lon: +(g.lon + Math.cos(a) * r * 1.5).toFixed(3), connectedApps: k % 3 === 0 ? ['Schadenmeldungs-Portal (Kunden)'] : [] };
  })),
  { name: 'Versicherer (Beispiel)', kind: 'service_provider', city: 'Köln', connectedApps: ['Versicherer-Schnittstellen (BiPRO)'], note: 'Platzhalter' },
  { name: 'Rechenzentrum (Beispiel)', kind: 'service_provider', city: 'Frankfurt', connectedApps: ['Maklerverwaltung (Bestand & Verträge)', 'Dokumentenmanagement'], note: 'Platzhalter' },
];
const people = [
  { name: 'IT-Leitung', role: 'Name eintragen', department: 'IT', responsibleFor: [] },
  { name: 'Leitung Schaden', role: 'Name eintragen', department: 'Schadenmanagement', responsibleFor: [] },
  { name: 'Leitung International', role: 'Funk Alliance', department: 'Funk Alliance', responsibleFor: [] },
  { name: 'Leitung Finanzen', role: 'Name eintragen', department: 'Finanzen', responsibleFor: [] },
  { name: 'Leitung Vertrieb', role: 'Name eintragen', department: 'Kundenbetreuung', responsibleFor: [] },
];

const input = CityInputSchema.parse({ company: 'Funk Gruppe (Demo)', apps, sites, partners, people });
const city = buildCity(input, { today: '2026-10-06' });
const data = { ...city, inventoryCsv: inventoryCsv(city), report: renderReport(city, { date: '2026-10-06' }) };
const banner = `<div style="position:fixed;left:50%;transform:translateX(-50%);bottom:6px;z-index:9;font:500 10px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#ffb020;background:rgba(6,8,22,.9);border:1px solid rgba(255,176,32,.5);padding:4px 10px;border-radius:2px;pointer-events:none">Demo · Standorte öffentlich · Software, Partner, Kunden = Platzhalter</div>`;
let html = readFileSync('/home/user/PluginPilot/web/src/city.html', 'utf8')
  .replace('<title>Software-Stadt</title>', '<title>Funk Netzwerk-Stadt</title>')
  .replace('<script>', `<script>window.__NO_DOWNLOAD = true; window.__FULLPAGE = true; window.__CITY__ = ${JSON.stringify(data).replaceAll('<', '\\u003c')};</script>\n<script>`)
  .replace('</body>', `${banner}</body>`);
writeFileSync(process.argv[2]!, html);
console.log('sites', city.sites.length, 'partners', city.partners.length, 'apps', city.buildings.length, 'quests', city.quests.length, 'bytes', html.length);
