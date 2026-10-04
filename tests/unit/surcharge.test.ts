import { describe, expect, it } from 'vitest';
import { ANNOUNCEMENTS } from '../../src/domain/surcharge/announcements.js';
import { AuditInputSchema, auditSurcharges, classify } from '../../src/domain/surcharge/audit.js';

const run = (x: Record<string, unknown>) => auditSurcharges(AuditInputSchema.parse(x));
const base = { carrier: 'Maersk', originCountry: 'DE', destinationCountry: 'OM', bookingDate: '2026-03-10', sailingDate: '2026-03-15' };

describe('classify', () => {
  it.each([
    ['WRS', 'WRS'], ['War Risk Surcharge', 'WRS'], ['Emergency Conflict Surcharge', 'ECS'], ['ECS', 'ECS'],
    ['Emergency Contingency Surcharge', 'ECS'], ['EBS', 'EBS'], ['Emergency Bunker Surcharge', 'EBS'],
    ['BAF', 'BAF'], ['Terminal Handling Charge', 'THC'], ['Operational Cost Recovery', 'OCR'], ['Documentation fee', 'OTHER'],
  ])('%s → %s', (label, code) => expect(classify(label)).toBe(code));
});

describe('database integrity', () => {
  it('every announcement has a source and a valid date', () => {
    for (const a of ANNOUNCEMENTS) {
      expect(a.source, a.id).toMatch(/^https:\/\//);
      expect(a.effective, a.id).toMatch(/^2026-\d{2}-\d{2}$/);
    }
  });
});

describe('auditSurcharges', () => {
  it('correct Maersk ECS after the effective date is ok', () => {
    const r = run({ ...base, lines: [{ label: 'Emergency Contingency Surcharge', amountUsd: 3000, containerType: '40HC' }] });
    expect(r.lines[0]?.status).toBe('ok');
    expect(r.verdict).toBe('no_issues_found');
  });

  it('Maersk ECS on cargo in transit before 06.03. is flagged (carrier: in-transit not impacted)', () => {
    const r = run({ ...base, bookingDate: '2026-02-20', sailingDate: '2026-02-27', lines: [{ label: 'ECS', amountUsd: 3000, containerType: '40DV' }] });
    expect(r.lines[0]?.status).toBe('flag');
    expect(r.totalOverchargeUsd).toBe(3000);
  });

  it('amount above the announcement is flagged with the difference', () => {
    const r = run({ ...base, lines: [{ label: 'ECS', amountUsd: 7000, containerType: '40HC', quantity: 2 }] });
    expect(r.lines[0]?.expected).toBe(6000);
    expect(r.totalOverchargeUsd).toBe(1000);
  });

  it('war risk on a lane outside the announced scope is flagged (Asia → Hamburg)', () => {
    const r = run({ carrier: 'Hapag-Lloyd', originCountry: 'CN', destinationCountry: 'DE', bookingDate: '2026-04-01', lines: [{ label: 'War Risk Surcharge', amountUsd: 3000, containerType: '40HC' }] });
    expect(r.lines[0]?.status).toBe('flag');
    expect(r.lines[0]?.findings[0]).toContain('does not include this lane');
  });

  it('Hapag WRS on Gulf cargo afloat before 02.03. is "check", not "flag" (carrier covers cargo afloat)', () => {
    const r = run({ carrier: 'Hapag Lloyd', originCountry: 'DE', destinationCountry: 'AE', bookingDate: '2026-02-15', sailingDate: '2026-02-25', lines: [{ label: 'WRS', amountUsd: 3000, containerType: '40HC' }] });
    expect(r.lines[0]?.status).toBe('check');
    expect(r.verdict).toBe('clarify');
  });

  it('EBS: FMC-regulated US trade uses the later effective date (09.04.)', () => {
    const line = [{ label: 'Emergency Bunker Surcharge', amountUsd: 400, containerType: '40HC' }];
    expect(run({ carrier: 'Maersk', originCountry: 'CN', destinationCountry: 'US', bookingDate: '2026-04-01', sailingDate: '2026-04-05', lines: line }).lines[0]?.status).toBe('flag');
    expect(run({ carrier: 'Maersk', originCountry: 'CN', destinationCountry: 'DE', bookingDate: '2026-04-01', sailingDate: '2026-04-05', lines: line }).lines[0]?.status).toBe('ok');
  });

  it('EBS backhaul is half', () => {
    const r = run({ carrier: 'Maersk', originCountry: 'DE', destinationCountry: 'CN', bookingDate: '2026-05-01', headhaul: false, lines: [{ label: 'EBS', amountUsd: 400, containerType: '40HC' }] });
    expect(r.lines[0]?.expected).toBe(200);
    expect(r.totalOverchargeUsd).toBe(200);
  });

  it('duplicates are flagged', () => {
    const r = run({ ...base, lines: [{ label: 'ECS', amountUsd: 3000, containerType: '40HC' }, { label: 'Emergency Contingency Surcharge', amountUsd: 3000, containerType: '40HC' }] });
    expect(r.lines.every((l) => l.status === 'flag')).toBe(true);
  });

  it('fixed all-in rate flags any added surcharge', () => {
    const r = run({ ...base, fixedAllInRate: true, lines: [{ label: 'ECS', amountUsd: 3000, containerType: '40HC' }] });
    expect(r.lines[0]?.status).toBe('flag');
  });

  it('unknown carrier asks for the advisory', () => {
    const r = run({ ...base, carrier: 'Some Line', lines: [{ label: 'WRS', amountUsd: 1000, containerType: '20DV' }] });
    expect(r.carrierKnown).toBe(false);
    expect(r.lines[0]?.status).toBe('check');
  });

  it('Maersk OCR excludes Far East origins', () => {
    const line = [{ label: 'Operational Cost Recovery', amountUsd: 500, containerType: '40HC' }];
    expect(run({ carrier: 'Maersk', originCountry: 'IN', destinationCountry: 'QA', bookingDate: '2026-09-20', lines: line }).lines[0]?.status).toBe('check'); // secondary source → note, still ok amount
    expect(run({ carrier: 'Maersk', originCountry: 'CN', destinationCountry: 'QA', bookingDate: '2026-09-20', lines: line }).lines[0]?.status).toBe('flag');
  });

  it('rejects bad input', () => {
    expect(() => AuditInputSchema.parse({ ...base, originCountry: 'Germany', lines: [] })).toThrow();
  });
});

describe('regressions', () => {
  it('a surcharge type missing from our database is "check", never "flag" (absence is not proof)', () => {
    const r = run({ ...base, lines: [{ label: 'War Risk Surcharge', amountUsd: 3000, containerType: '40HC', quantity: 2 }] });
    expect(r.lines[0]?.status).toBe('check');
    expect(r.totalOverchargeUsd).toBe(0);
  });
});
