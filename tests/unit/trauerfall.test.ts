import { describe, expect, it } from 'vitest';
import { addMonths, easter, endOfMonthAfter, isWerktag, nthWerktagAfter } from '../../src/domain/trauerfall/calendar.js';
import { InvalidSituationError, planAfterDeath } from '../../src/domain/trauerfall/plan.js';
import { SituationSchema, type Situation } from '../../src/domain/trauerfall/schema.js';

const sit = (x: Partial<Situation> & { dateOfDeath: string }): Situation => SituationSchema.parse(x);
const step = (p: ReturnType<typeof planAfterDeath>, id: string) => p.steps.find((s) => s.id === id);

describe('calendar', () => {
  it('easter', () => {
    expect(easter(2026)).toBe('2026-04-05');
    expect(easter(2027)).toBe('2027-03-28');
    expect(easter(2025)).toBe('2025-04-20');
  });
  it('werktage skip Sundays and national holidays, include Saturdays', () => {
    expect(isWerktag('2026-10-03')).toBe(false); // Tag der Deutschen Einheit
    expect(isWerktag('2026-10-04')).toBe(false); // Sunday
    expect(isWerktag('2026-10-10')).toBe(true); // Saturday
    expect(isWerktag('2026-04-03')).toBe(false); // Karfreitag 2026
  });
  it('3rd Werktag after death', () => {
    expect(nthWerktagAfter('2026-10-05', 3)).toBe('2026-10-08'); // Mon → Thu
    expect(nthWerktagAfter('2026-10-08', 3)).toBe('2026-10-12'); // Thu → Fri, Sat, (Sun) Mon
    expect(nthWerktagAfter('2026-04-02', 3)).toBe('2026-04-08'); // Easter: Fri hol, Sat, Sun, Mon hol → Sat, Tue, Wed
    expect(nthWerktagAfter('2026-12-23', 3)).toBe('2026-12-29'); // 24 Thu, (25+26 holidays, 27 Sun), 28 Mon, 29 Tue
  });
  it('month arithmetic', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-10-04', 3)).toBe('2027-01-04');
    expect(endOfMonthAfter('2026-03-15', 12)).toBe('2027-03-31');
  });
});

describe('planAfterDeath', () => {
  const today = '2026-10-05';

  it('minimal plan has core steps in order', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05' }), today);
    const ids = p.steps.map((s) => s.id);
    expect(ids.slice(0, 2)).toEqual(['leichenschau', 'bestatter']);
    expect(ids).toContain('standesamt');
    expect(ids).toContain('ausschlagung');
    expect(ids).not.toContain('witwenrente');
    expect(step(p, 'standesamt')?.dueDate).toBe('2026-10-08');
    expect(step(p, 'ausschlagung')?.dueDate).toBe('2026-11-16'); // +42 days
    expect(p.support).toContain('0800 111 0 111');
  });

  it('widow with pension: Sterbevierteljahr 30 days and pension 12 months', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05', relationship: 'spouse_or_partner', survivingSpouse: true, deceasedReceivedPension: true }), today);
    expect(step(p, 'sterbevierteljahr')?.dueDate).toBe('2026-11-04');
    expect(step(p, 'witwenrente')?.dueDate).toBe('2027-10-31');
    expect(p.nextDeadline?.id).toBe('standesamt');
  });

  it('co-insured spouse gets 3-month health insurance deadline', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05', survivingSpouse: true, survivingSpouseFamilyInsured: true }), today);
    expect(step(p, 'krankenversicherung')?.dueDate).toBe('2027-01-05');
  });

  it('rental: heirs vs. household members', () => {
    const heirs = planAfterDeath(sit({ dateOfDeath: '2026-10-05', rentedApartment: true }), today);
    expect(step(heirs, 'mietvertrag')?.legalBasis).toBe('§ 564 BGB');
    const together = planAfterDeath(sit({ dateOfDeath: '2026-10-05', rentedApartment: true, livedTogether: true }), today);
    expect(step(together, 'mietvertrag')?.legalBasis).toBe('§ 563 Abs. 3 BGB');
    expect(step(together, 'mietvertrag')?.dueDate).toBe('2026-11-05');
  });

  it('debts make disclaimer critical; abroad extends to 6 months', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05', debtsSuspected: true }), today);
    expect(step(p, 'ausschlagung')?.critical).toBe(true);
    const abroad = planAfterDeath(sit({ dateOfDeath: '2026-10-05', deceasedLivedAbroad: true }), today);
    expect(step(abroad, 'ausschlagung')?.dueDate).toBe('2027-04-05');
  });

  it('knowledge date shifts heir deadlines, not registration', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-09-01', knowledgeDate: '2026-09-20' }), today);
    expect(step(p, 'ausschlagung')?.dueDate).toBe('2026-11-01');
    expect(step(p, 'standesamt')?.dueDate).toBe('2026-09-04');
  });

  it('marks passed deadlines as overdue, but never "sofort" actions', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-08-01', survivingSpouse: true, deceasedReceivedPension: true }), today);
    expect(step(p, 'sterbevierteljahr')?.overdue).toBe(true);
    expect(step(p, 'leichenschau')?.overdue).toBe(false);
    expect(p.nextDeadline?.overdue).toBe(false);
  });

  it('conditional steps appear only when relevant', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05', willFound: true, ownedVehicle: true, deceasedSelfEmployed: true, hasLifeInsurance: true, placeOfDeath: 'hospital_or_care_home' }), today);
    const ids = p.steps.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['testament', 'fahrzeug', 'gewerbe', 'lebensversicherung']));
    expect(ids).not.toContain('leichenschau');
  });

  it('death abroad: no Standesamt deadline, embassy first', () => {
    const p = planAfterDeath(sit({ dateOfDeath: '2026-10-05', placeOfDeath: 'abroad' }), today);
    expect(p.steps[0]?.id).toBe('ausland');
    expect(step(p, 'standesamt')).toBeUndefined();
  });

  it('rejects future, too old and inconsistent dates', () => {
    expect(() => planAfterDeath(sit({ dateOfDeath: '2026-10-06' }), today)).toThrow(InvalidSituationError);
    expect(() => planAfterDeath(sit({ dateOfDeath: '2019-01-01' }), today)).toThrow(InvalidSituationError);
    expect(() => planAfterDeath(sit({ dateOfDeath: '2026-10-01', knowledgeDate: '2026-09-01' }), today)).toThrow(InvalidSituationError);
    expect(() => planAfterDeath(sit({ dateOfDeath: '2026-02-30' }), today)).toThrow(RangeError);
  });

  it('rejects unknown fields', () => {
    expect(() => SituationSchema.parse({ dateOfDeath: '2026-10-01', name: 'Max' })).toThrow();
  });
});

describe('regressions', () => {
  it('survivor pensions are shown in the coming weeks, not "later" (apply early)', () => {
    const p = planAfterDeath(SituationSchema.parse({ dateOfDeath: '2026-09-28', survivingSpouse: true, childrenUnder27: true }), '2026-10-04');
    expect(p.steps.find((s) => s.id === 'witwenrente')?.phase).toBe('erste_wochen');
    expect(p.steps.find((s) => s.id === 'waisenrente')?.phase).toBe('erste_wochen');
  });
  it('every step with a § reference links to an official source', () => {
    const p = planAfterDeath(SituationSchema.parse({ dateOfDeath: '2026-09-28', survivingSpouse: true, deceasedReceivedPension: true, survivingSpouseFamilyInsured: true, rentedApartment: true, willFound: true, deceasedSelfEmployed: true }), '2026-10-04');
    for (const s of p.steps.filter((x) => x.legalBasis?.includes('§'))) expect(s.sourceUrl, s.id).toMatch(/^https:\/\//);
  });
});
