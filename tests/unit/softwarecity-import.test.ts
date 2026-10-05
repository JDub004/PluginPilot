import { describe, expect, it } from 'vitest';
import { buildCity } from '../../src/domain/softwarecity/build.js';
import { guessCategory, importLedger, importTable, mergeApps, parseNumber } from '../../src/domain/softwarecity/import.js';
import { compareCities, decodeShare, encodeShare, renderReport } from '../../src/domain/softwarecity/report.js';
import { SAMPLE_COMPANY } from '../../src/domain/softwarecity/sample.js';
import { CityInputSchema } from '../../src/domain/softwarecity/schema.js';

describe('table import', () => {
  it('reads a German Excel paste (semicolon, German numbers, ja/nein)', () => {
    const t = 'Programm;Abteilung;Nutzer;Lizenzen;Kosten/Monat;Verantwortlich;Kritisch;Freigegeben;Daten an\n' +
      'Salesforce;Vertrieb;8;10;1.250,00 €;Anna;ja;ja;DATEV, Slack\n' +
      'Kundenliste.xlsx;Vertrieb;3;;;;ja;;\n' +
      'Trello;Marketing;2;;;;nein;nein;';
    const r = importTable(t);
    expect(r.warnings).toEqual([]);
    expect(r.apps[0]).toMatchObject({ name: 'Salesforce', category: 'crm', department: 'Vertrieb', users: 8, licenses: 10, monthlyCostEur: 1250, owner: 'Anna', critical: true, approved: true, dataFlowsTo: ['DATEV', 'Slack'] });
    expect(r.apps[1]).toMatchObject({ category: 'spreadsheet', critical: true });
    expect(r.apps[2]).toMatchObject({ category: 'collaboration', approved: false });
  });

  it('reads TSV with English headers and quoted commas', () => {
    const r = importTable('Name\tDepartment\tUsers\tCategory\n"Acme, Tool"\tAll\t5\tsupport');
    expect(r.apps[0]).toMatchObject({ name: 'Acme, Tool', department: 'All', users: 5, category: 'support' });
  });

  it('missing name column and invalid numbers become warnings, not crashes', () => {
    expect(importTable('Foo;Bar\n1;2').apps).toEqual([]);
    const r = importTable('Programm;Nutzer\nSlack;viele');
    expect(r.apps[0]?.users).toBeUndefined();
    expect(r.warnings[0]).toMatch(/keine Zahl/);
  });

  it('missing department defaults to the shared Marktplatz', () => {
    expect(importTable('Programm\nSlack').apps[0]?.department).toBe('Alle');
  });

  it('parses number formats', () => {
    expect(parseNumber('1.234,50')).toBe(1234.5);
    expect(parseNumber('1,234.50')).toBe(1234.5);
    expect(parseNumber('49,9 €')).toBe(49.9);
    expect(parseNumber('abc')).toBeUndefined();
    expect(guessCategory('Personio Abo')).toBe('hr');
  });
});

describe('ledger import', () => {
  const csv = 'Datum;Buchungstext;Betrag\n' +
    '05.01.2026;Slack Technologies Rechnung;-120,00\n05.02.2026;Slack Technologies Rechnung;-120,00\n05.03.2026;Slack Technologies Rechnung;-120,00\n' +
    '10.01.2026;HUBSPOT INC;-300,00\n12.02.2026;Miete Büro;-2.000,00\n03.03.2026;Bäckerei;-12,50';
  it('finds SaaS vendors and averages cost per month', () => {
    const r = importLedger(csv);
    expect(r.apps.map((a) => [a.name, a.monthlyCostEur])).toEqual([['Slack', 120], ['HubSpot', 100]]);
  });
  it('rejects exports without amount column', () => {
    expect(importLedger('Datum;Text\n1.1.2026;Slack').warnings[0]).toMatch(/Betrag/);
  });
  it('merge: table facts win, ledger fills gaps', () => {
    const t = importTable('Programm;Abteilung;Nutzer\nSlack;Alle;12').apps;
    const merged = mergeApps(t, importLedger(csv).apps);
    expect(merged.find((a) => a.name === 'Slack')).toMatchObject({ users: 12, monthlyCostEur: 120, department: 'Alle' });
    expect(merged).toHaveLength(2);
  });
});

describe('report, comparison, share link', () => {
  const input = CityInputSchema.parse(SAMPLE_COMPANY);
  const before = buildCity(input);
  it('after cleaning up, health rises and solved quests are listed', () => {
    const fixed = CityInputSchema.parse({ ...SAMPLE_COMPANY, apps: SAMPLE_COMPANY.apps.map((a) => ({ ...a, approved: true, owner: a.owner ?? 'IT' })) });
    const c = compareCities(before, buildCity(fixed));
    expect(c.healthAfter).toBeGreaterThan(c.healthBefore);
    expect(c.solved.length).toBeGreaterThan(0);
    expect(c.added).toEqual([]);
    const md = renderReport(buildCity(fixed), { preparedBy: 'IT-Partner GmbH', date: '2026-10-05', comparison: c });
    expect(md).toContain('erstellt von IT-Partner GmbH');
    expect(md).toContain('## Vorher / Nachher');
  });
  it('REVIEW.md case 5: dropping Slack solves the communication overlap', () => {
    const after = buildCity(CityInputSchema.parse({ ...SAMPLE_COMPANY, apps: SAMPLE_COMPANY.apps.filter((a) => a.name !== 'Slack').map((a) => ({ ...a, dataFlowsTo: (a.dataFlowsTo ?? []).filter((n) => n !== 'Slack') })) }));
    const c = compareCities(before, after);
    expect(c.solved).toContain('2 Tools für Kommunikation');
    expect(c.healthAfter).toBeGreaterThan(c.healthBefore);
  });
  it('report is deterministic and lists every quest', () => {
    const md = renderReport(before);
    expect(md).toBe(renderReport(before));
    expect(md.split('\n').filter((l) => /^\| (Hoch|Mittel|Niedrig) \|/.test(l))).toHaveLength(before.quests.length);
  });
  it('share link round-trips and rejects junk', () => {
    expect(CityInputSchema.parse(decodeShare(encodeShare(input)))).toEqual(input);
    expect(() => decodeShare('../etc')).toThrow();
  });
});
