import { describe, expect, it } from 'vitest';
import { buildCity } from '../../src/domain/softwarecity/build.js';
import { SAMPLE_COMPANY } from '../../src/domain/softwarecity/sample.js';
import { CityInputSchema } from '../../src/domain/softwarecity/schema.js';

const city = buildCity(CityInputSchema.parse(SAMPLE_COMPANY));
const quest = (kind: string, name: string) => city.quests.find((q) => q.kind === kind && q.title.includes(name));

describe('softwarecity layout', () => {
  it('one building per app, shared tools on the central "Marktplatz"', () => {
    expect(city.buildings).toHaveLength(SAMPLE_COMPANY.apps.length);
    expect(city.districts[0]?.name).toBe('Marktplatz');
    expect(city.buildings.find((b) => b.name === 'Slack')?.district).toBe('Marktplatz');
  });

  it('no two buildings share a tile and every building lies inside its district', () => {
    const tiles = new Set(city.buildings.map((b) => `${b.gx},${b.gy}`));
    expect(tiles.size).toBe(city.buildings.length);
    for (const b of city.buildings) {
      const d = city.districts.find((x) => x.name === b.district)!;
      expect(b.gx).toBeGreaterThanOrEqual(d.gx);
      expect(b.gx).toBeLessThan(d.gx + d.w);
      expect(b.gy).toBeLessThan(d.gy + d.h);
    }
  });

  it('districts do not overlap', () => {
    for (const a of city.districts) for (const b of city.districts) {
      if (a === b) continue;
      const overlap = a.gx < b.gx + b.w && b.gx < a.gx + a.w && a.gy < b.gy + b.h && b.gy < a.gy + a.h;
      expect(overlap, `${a.name}/${b.name}`).toBe(false);
    }
  });

  it('roads only connect known apps; floors grow with users', () => {
    expect(city.roads).toContainEqual({ from: 'hubspot', to: 'datev' });
    const m365 = city.buildings.find((b) => b.name === 'Microsoft 365')!;
    const power = city.buildings.find((b) => b.name === 'Power BI')!;
    expect(m365.floors).toBeGreaterThan(power.floors);
  });
});

describe('softwarecity quests', () => {
  it('finds duplicate tools with savings', () => {
    const crm = quest('duplicate', 'CRM');
    expect(crm?.buildingIds).toEqual(['hubspot', 'pipedrive']);
    expect(crm?.savingEurYear).toBe(120 * 12);
    expect(quest('duplicate', 'Kommunikation')).toBeDefined(); // Slack + Teams
  });
  it('computes unused licences', () => {
    expect(quest('unused_licenses', 'Microsoft 365')?.savingEurYear).toBe(Math.round((600 / 50) * 8 * 12));
  });
  it('flags critical spreadsheets, shadow IT, missing owners and unknown data targets', () => {
    expect(quest('critical_spreadsheet', 'Kundenliste.xlsx')?.severity).toBe('high');
    expect(quest('shadow_it', 'Dropbox')).toBeDefined();
    expect(quest('no_owner', 'Kundenliste.xlsx')).toBeDefined();
    expect(quest('unknown_flow', 'DATEV')?.detail).toContain('Steuerberater-Portal');
  });
  it('high-severity quests come first; health score and savings are consistent', () => {
    expect(city.quests[0]?.severity).toBe('high');
    expect(city.stats.potentialSavingsEurYear).toBe(city.quests.reduce((s, q) => s + (q.savingEurYear ?? 0), 0));
    expect(city.stats.healthScore).toBeGreaterThanOrEqual(0);
    expect(city.stats.healthScore).toBeLessThan(100);
  });
  it('a clean single-app company has no quests and full health', () => {
    const c = buildCity(CityInputSchema.parse({ company: 'Mini', apps: [{ name: 'Notion', category: 'collaboration', department: 'Alle', users: 2, owner: 'Chefin' }] }));
    expect(c.quests).toHaveLength(0);
    expect(c.stats.healthScore).toBe(100);
  });
  it('duplicate app names get unique ids', () => {
    const c = buildCity(CityInputSchema.parse({ company: 'X', apps: [{ name: 'Excel', category: 'spreadsheet', department: 'A' }, { name: 'Excel', category: 'spreadsheet', department: 'B' }] }));
    expect(new Set(c.buildings.map((b) => b.id)).size).toBe(2);
  });
  it('rejects unknown fields and too many apps', () => {
    expect(() => CityInputSchema.parse({ company: 'X', apps: [{ name: 'A', category: 'crm', department: 'B', password: 'x' }] })).toThrow();
    expect(() => CityInputSchema.parse({ company: 'X', apps: Array.from({ length: 121 }, (_, i) => ({ name: `A${i}`, category: 'other', department: 'B' })) })).toThrow();
  });
});

describe('regression: wording', () => {
  it('singular for one unused licence', () => {
    const c = buildCity(CityInputSchema.parse({ company: 'X', apps: [{ name: 'Asana', category: 'collaboration', department: 'Alle', users: 9, licenses: 10, monthlyCostEur: 110, owner: 'COO' }] }));
    expect(c.quests[0]?.title).toBe('1 ungenutzte Lizenz in Asana');
  });
});

describe('people, sites and partners', () => {
  it('builds key persons, site towns, partners and the key-person quest', async () => {
    const { buildCity } = await import('../../src/domain/softwarecity/build.js');
    const { SAMPLE_COMPANY } = await import('../../src/domain/softwarecity/sample.js');
    const { CityInputSchema } = await import('../../src/domain/softwarecity/schema.js');
    const city = buildCity(CityInputSchema.parse(SAMPLE_COMPANY));
    expect(city.people.find((p) => p.name === 'Mara Beispiel')?.buildingIds.length).toBeGreaterThanOrEqual(3);
    expect(city.quests.some((q) => q.kind === 'key_person' && q.title.includes('Mara Beispiel'))).toBe(true);
    expect(city.quests.some((q) => q.kind === 'key_person' && q.title.includes('Lena Demo'))).toBe(false);
    const leipzig = city.sites.find((s) => s.name === 'Lager Leipzig')!;
    expect(leipzig.lat).toBeCloseTo(51.34, 1);
    expect(leipzig.buildingIds).toContain('lagerverwaltung');
    expect(leipzig.buildingIds).not.toContain('hubspot');
    expect(leipzig.layout.districts.find((d) => d.name === 'Logistik')?.personIds).toHaveLength(1);
    const spedition = city.partners.find((p) => p.name === 'Spedition Nordlicht')!;
    expect(spedition.siteId).toBe(leipzig.id);
    expect(city.quests.some((q) => q.kind === 'unknown_flow' && q.detail.includes('Spedition'))).toBe(false);
    const lager = city.buildings.find((b) => b.id === 'lagerverwaltung')!;
    expect(lager.importance).toBe(5);
    expect(lager.floors).toBeGreaterThan(city.buildings.find((b) => b.id === 'pipedrive')!.floors);
  });
});

describe('work savers', () => {
  it('flags notice periods, attaches drafts and exports an inventory', async () => {
    const { buildCity } = await import('../../src/domain/softwarecity/build.js');
    const { inventoryCsv, renderReport } = await import('../../src/domain/softwarecity/report.js');
    const { toIsoDate } = await import('../../src/domain/softwarecity/import.js');
    const { SAMPLE_COMPANY } = await import('../../src/domain/softwarecity/sample.js');
    const { CityInputSchema } = await import('../../src/domain/softwarecity/schema.js');
    const input = CityInputSchema.parse(SAMPLE_COMPANY);
    const c = buildCity(input, { today: '2026-10-05' });
    const r = c.quests.find((q) => q.kind === 'renewal' && q.title.includes('HubSpot'))!;
    expect(r.deadline).toBe('2026-11-01');
    expect(r.severity).toBe('high');
    expect(r.title).toContain('noch 27 Tage');
    expect(c.quests.find((q) => q.kind === 'renewal' && q.title.includes('Zendesk'))?.severity).toBe('medium');
    expect(c.quests.every((q) => q.action && q.action.draft.length > 40)).toBe(true);
    expect(buildCity(input).quests.some((q) => q.kind === 'renewal')).toBe(false);
    const csv = inventoryCsv(c).split('\n');
    expect(csv[0]).toMatch(/^Programm;Kategorie/);
    expect(csv).toHaveLength(c.buildings.length + 1);
    const md = renderReport(c);
    expect(md).toContain('## Vertragsfristen');
    expect(md).toContain('## Notfall-Kontakte');
    expect(toIsoDate('31.12.26')).toBe('2026-12-31');
    expect(toIsoDate('1.2.2027')).toBe('2027-02-01');
    expect(toIsoDate('bald')).toBeUndefined();
  });
});

describe('share link privacy', () => {
  it('never puts contact details into the share link', async () => {
    const { encodeShare, decodeShare, shareSafe } = await import('../../src/domain/softwarecity/report.js');
    const { SAMPLE_COMPANY } = await import('../../src/domain/softwarecity/sample.js');
    const { CityInputSchema } = await import('../../src/domain/softwarecity/schema.js');
    const input = CityInputSchema.parse(SAMPLE_COMPANY);
    const raw = JSON.stringify(decodeShare(encodeShare(shareSafe(input))));
    expect(raw).not.toContain('@beispiel.example');
    expect(raw).not.toContain('+49 40');
    expect(raw).not.toContain('Support-Hotline');
    expect(raw).toContain('Mara Beispiel');
    expect(CityInputSchema.safeParse(JSON.parse(raw)).success).toBe(true);
  });
});

describe('branches, alliance and customers', () => {
  it('assigns customers to the named branch and keeps branch contacts out of share links', async () => {
    const { buildCity } = await import('../../src/domain/softwarecity/build.js');
    const { encodeShare, decodeShare, shareSafe } = await import('../../src/domain/softwarecity/report.js');
    const { CityInputSchema } = await import('../../src/domain/softwarecity/schema.js');
    const input = CityInputSchema.parse({
      company: 'Makler AG', apps: [{ name: 'Microsoft 365', category: 'collaboration', department: 'Alle', users: 50 }],
      sites: [{ name: 'Zentrale', city: 'Hamburg', main: true }, { name: 'NL München', city: 'München', contact: 'Frau Beispiel', phone: '+49 89 000' }],
      partners: [{ name: 'Kunde A', kind: 'customer', site: 'NL München' }, { name: 'Partner Wien', kind: 'alliance', city: 'Wien' }, { name: 'Kunde B', kind: 'customer', site: 'München' }],
    });
    const c = buildCity(input);
    const muc = c.sites.find((s) => s.name === 'NL München')!;
    expect(muc.contact).toBe('Frau Beispiel');
    expect(c.partners.filter((p) => p.siteId === muc.id).map((p) => p.name)).toEqual(['Kunde A', 'Kunde B']);
    expect(c.partners.find((p) => p.kind === 'alliance')?.lat).toBeCloseTo(48.2, 1);
    const raw = JSON.stringify(decodeShare(encodeShare(shareSafe(input))));
    expect(raw).not.toContain('Frau Beispiel');
    expect(raw).not.toContain('+49 89');
  });
});
