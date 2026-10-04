import { describe, expect, it } from 'vitest';
import { checkStatement, endOfMonthAfter, InvalidStatementError } from '../../src/domain/nebenkosten/check.js';
import { classify } from '../../src/domain/nebenkosten/categories.js';
import { landlordCo2Percent } from '../../src/domain/nebenkosten/co2.js';
import type { Statement } from '../../src/domain/nebenkosten/schema.js';

const base: Statement = {
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31',
  receivedDate: '2025-06-15',
  items: [
    { label: 'Grundsteuer', tenantShare: 200 },
    { label: 'Müllabfuhr', tenantShare: 150 },
  ],
};
const ids = (s: Statement) => checkStatement(s).findings.map((f) => f.id);

describe('categories', () => {
  it.each([
    ['Grundsteuer', 'allocable'],
    ['Hausmeister', 'allocable'],
    ['Verwaltungskosten', 'not_allocable'],
    ['Reparatur Aufzug', 'not_allocable'],
    ['Kontoführungsgebühren', 'not_allocable'],
    ['Instandhaltungsrücklage', 'not_allocable'],
    ['Kabel-TV', 'allocable'],
    ['Allgemeinstrom', 'allocable'],
    ['Heizkosten', 'allocable'],
    ['Wartung Rauchwarnmelder', 'allocable'],
    ['Diverses', 'unknown'],
  ])('%s → %s', (label, kind) => expect(classify(label).kind).toBe(kind));
});

describe('dates', () => {
  it('end of 12th month after', () => {
    expect(endOfMonthAfter('2024-12-31', 12)).toBe('2025-12-31');
    expect(endOfMonthAfter('2025-03-15', 12)).toBe('2026-03-31');
    expect(endOfMonthAfter('2024-02-29', 12)).toBe('2025-02-28');
  });
});

describe('checkStatement', () => {
  it('clean statement has no issues', () => {
    const r = checkStatement(base);
    expect(r.verdict).toBe('no_issues_found');
    expect(r.estimatedOverchargeEur).toBe(0);
    expect(r.objectionDeadline).toBe('2026-06-30');
  });

  it('rejects inverted period', () => {
    expect(() => checkStatement({ ...base, periodEnd: '2023-01-01' })).toThrow(InvalidStatementError);
  });

  it('flags period longer than 12 months', () => {
    expect(ids({ ...base, periodEnd: '2025-01-31' })).toContain('period-too-long');
    expect(ids({ ...base, periodStart: '2024-03-01', periodEnd: '2025-02-28' })).not.toContain('period-too-long');
  });

  it('late statement voids the Nachzahlung', () => {
    const r = checkStatement({ ...base, receivedDate: '2026-01-05', prepaymentsTotal: 300, statedBalance: 50 });
    const f = r.findings.find((x) => x.id === 'statement-late');
    expect(f?.severity).toBe('error');
    expect(f?.estimatedOverchargeEur).toBe(50);
  });

  it('statement on the last allowed day is in time', () => {
    expect(ids({ ...base, receivedDate: '2025-12-31' })).not.toContain('statement-late');
  });

  it('non-allocable items are errors with full amount', () => {
    const r = checkStatement({ ...base, items: [...base.items, { label: 'Verwaltungskosten', tenantShare: 120.5 }] });
    expect(r.verdict).toBe('issues_found');
    expect(r.estimatedOverchargeEur).toBe(120.5);
  });

  it('unknown items are warnings', () => {
    const r = checkStatement({ ...base, items: [{ label: 'Diverses', tenantShare: 10 }] });
    expect(r.verdict).toBe('warnings_only');
  });

  it('cable TV pro rata after 2024-07-01', () => {
    const r = checkStatement({ ...base, items: [{ label: 'Kabelanschluss', tenantShare: 120 }] });
    const f = r.findings.find((x) => x.id === 'cable-tv-after-2024');
    // 184 of 366 days in 2024
    expect(f?.estimatedOverchargeEur).toBeCloseTo((120 * 184) / 366, 1);
  });

  it('cable TV before cutoff is fine', () => {
    expect(ids({ ...base, periodStart: '2023-01-01', periodEnd: '2023-12-31', receivedDate: '2024-05-01', items: [{ label: 'Kabel-TV', tenantShare: 100 }] })).not.toContain('cable-tv-after-2024');
  });

  it('allocation arithmetic error', () => {
    const r = checkStatement({
      ...base,
      items: [{ label: 'Hausmeister', totalCost: 6000, allocationKey: 'area', totalAllocationUnits: 600, tenantAllocationUnits: 60, tenantShare: 700 }],
    });
    const f = r.findings.find((x) => x.id === 'allocation-math');
    expect(f?.estimatedOverchargeEur).toBe(100);
  });

  it('allocation arithmetic within tolerance passes', () => {
    expect(
      ids({ ...base, items: [{ label: 'Hausmeister', totalCost: 6000, totalAllocationUnits: 600, tenantAllocationUnits: 60, tenantShare: 600.8 }] }),
    ).not.toContain('allocation-math');
  });

  it('area mismatch', () => {
    const r = checkStatement({
      ...base,
      apartmentSqm: 60,
      items: [{ label: 'Grundsteuer', allocationKey: 'area', totalCost: 6600, totalAllocationUnits: 660, tenantAllocationUnits: 66, tenantShare: 660 }],
    });
    const f = r.findings.find((x) => x.id === 'area-mismatch');
    expect(f?.estimatedOverchargeEur).toBe(60);
  });

  it('balance mismatch', () => {
    const r = checkStatement({ ...base, prepaymentsTotal: 300, statedBalance: 80 });
    expect(r.findings.find((x) => x.id === 'balance-mismatch')?.estimatedOverchargeEur).toBe(30);
  });

  it('heating consumption share outside 50-70 %', () => {
    expect(ids({ ...base, heating: { consumptionSharePercent: 40 } })).toContain('heating-consumption-share');
    expect(ids({ ...base, heating: { consumptionSharePercent: 70 } })).not.toContain('heating-consumption-share');
  });

  it('15 % cut when heating not billed by consumption', () => {
    const r = checkStatement({ ...base, items: [{ label: 'Heizkosten', tenantShare: 1000 }], heating: { billedByConsumption: false } });
    expect(r.findings.find((x) => x.id === 'heating-not-by-consumption')?.estimatedOverchargeEur).toBe(150);
  });

  it('3 % cut when CO2 info missing', () => {
    const r = checkStatement({ ...base, items: [{ label: 'Heizkosten Gas', tenantShare: 900 }], heating: { fossilFuel: true, co2InfoShown: false } });
    expect(r.findings.find((x) => x.id === 'co2-info-missing')?.estimatedOverchargeEur).toBe(27);
  });

  it('CO2 split not applied', () => {
    const r = checkStatement({
      ...base,
      heating: { fossilFuel: true, co2KgPerSqmYear: 35, tenantCo2CostShareBeforeSplit: 200, co2LandlordShareApplied: 0 },
    });
    expect(r.findings.find((x) => x.id === 'co2-split')?.estimatedOverchargeEur).toBe(100);
  });

  it('CO2 rules ignored before 2023', () => {
    expect(
      ids({ ...base, periodStart: '2022-01-01', periodEnd: '2022-12-31', receivedDate: '2023-03-01', heating: { fossilFuel: true, co2InfoShown: false } }),
    ).not.toContain('co2-info-missing');
  });
});

describe('CO2 stages', () => {
  it.each([
    [0, 0], [11.99, 0], [12, 10], [16.9, 10], [17, 20], [32, 50], [36.99, 50], [47, 80], [51.9, 80], [52, 95], [200, 95],
  ])('%d kg → %d %%', (kg, pct) => expect(landlordCo2Percent(kg)).toBe(pct));
});
