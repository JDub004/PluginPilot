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
