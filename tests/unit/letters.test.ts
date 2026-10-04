import { describe, expect, it } from 'vitest';
import { tenancyEndAfterNotice } from '../../src/domain/trauerfall/calendar.js';
import { draftLetter, LETTER_TYPES } from '../../src/domain/trauerfall/letters.js';
import { planAfterDeath } from '../../src/domain/trauerfall/plan.js';
import { SituationSchema } from '../../src/domain/trauerfall/schema.js';

describe('tenancyEndAfterNotice (§ 573d Abs. 2 BGB)', () => {
  it.each([
    ['2026-10-02', '2026-12-31'], // Oct: 1 Thu, 2 Fri, (3 holiday+Sat), 5 Mon = 3rd workday
    ['2026-10-05', '2026-12-31'],
    ['2026-10-06', '2027-01-31'],
    ['2027-02-03', '2027-04-30'],
    ['2027-02-04', '2027-05-31'],
  ])('notice received %s → lease ends %s', (rec, end) => expect(tenancyEndAfterNotice(rec)).toBe(end));
});

describe('draftLetter', () => {
  const base = { today: '2026-10-05', dateOfDeath: '2026-09-28' };

  it('every letter type renders with placeholders when no personal data is given', () => {
    for (const type of LETTER_TYPES) {
      const l = draftLetter({ ...base, type });
      expect(l.body).toContain('[Ihr Name]');
      expect(l.body).toContain('28.09.2026');
      expect(l.subject.length).toBeGreaterThan(5);
    }
  });

  it('heir termination computes the lease end (receipt assumed in 3 days)', () => {
    const l = draftLetter({ ...base, type: 'mietvertrag_kuendigung_erben', senderName: 'Anna Beispiel', deceasedName: 'Karl Beispiel' });
    expect(l.computed?.date).toBe('2027-01-31'); // receipt 08.10. is after the 3rd workday (05.10.)
    expect(l.body).toContain('zum 31.01.2027');
    expect(l.body).toContain('Anna Beispiel');
    expect(l.body).toContain('§ 564 BGB');
  });

  it('plan steps point to existing letter types', () => {
    const p = planAfterDeath(SituationSchema.parse({ dateOfDeath: '2026-09-28', rentedApartment: true, survivingSpouse: true, survivingSpouseFamilyInsured: true, deceasedEmployed: true, willFound: true }), '2026-10-05');
    const types = p.steps.map((s) => s.letterType).filter(Boolean);
    expect(types.length).toBeGreaterThanOrEqual(6);
    for (const t of types) expect(LETTER_TYPES).toContain(t);
  });
});
