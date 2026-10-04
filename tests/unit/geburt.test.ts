import { describe, expect, it } from 'vitest';
import { BirthSituationSchema, InvalidBirthSituationError, planAfterBirth } from '../../src/domain/geburt/plan.js';

const plan = (x: Record<string, unknown>, today = '2026-09-20') => planAfterBirth(BirthSituationSchema.parse({ birthDate: '2026-09-15', ...x }), today);
const due = (p: ReturnType<typeof planAfterBirth>, id: string) => p.steps.find((s) => s.id === id)?.dueDate;

describe('planAfterBirth', () => {
  it('core deadlines (hand-checked against PStG, BEEG, EStG)', () => {
    const p = plan({});
    expect(due(p, 'geburtsanzeige')).toBe('2026-09-22'); // § 18 PStG: 1 week
    expect(due(p, 'elterngeld')).toBe('2027-01-14'); // § 7 BEEG: must arrive in 4th month of life (15.12.–14.01.)
    expect(due(p, 'kindergeld')).toBe('2027-03-31'); // § 70 EStG: 6 months before application month
    expect(p.phaseSet).toBe('geburt');
    expect(p.support).toContain('0800 111 0 550');
  });

  it('Elternzeit after maternity protection: 8 weeks → notice at birth + 7 days; preterm 12 weeks → +35 days', () => {
    expect(due(plan({ motherEmployed: true }), 'elternzeit_mutter')).toBe('2026-09-22');
    expect(due(plan({ motherEmployed: true, pretermOrMultiple: true }), 'elternzeit_mutter')).toBe('2026-10-20');
  });

  it('other parent: 7 weeks before the planned start', () => {
    expect(due(plan({ otherParentEmployed: true, otherParentLeaveStart: '2027-01-01' }), 'elternzeit_partner')).toBe('2026-11-13');
    expect(due(plan({ otherParentEmployed: true }), 'elternzeit_partner')).toBeUndefined();
  });

  it('single parent: Unterhaltsvorschuss only 1 month retroactive (§ 4 UVG)', () => {
    expect(due(plan({ singleParent: true }), 'unterhaltsvorschuss')).toBe('2026-10-31');
  });

  it('unmarried parents get paternity step; hospital birth makes registration non-critical', () => {
    const p = plan({ parentsMarried: false });
    expect(p.steps.some((s) => s.id === 'vaterschaft')).toBe(true);
    expect(p.steps.find((s) => s.id === 'geburtsanzeige')?.critical).toBe(false);
    expect(plan({ bornInHospital: false }).steps.find((s) => s.id === 'geburtsanzeige')?.critical).toBe(true);
  });

  it('Kita as a guideline 6 months before the 1st birthday', () => {
    expect(due(plan({ needsChildcare: true }), 'kita')).toBe('2027-03-15');
  });

  it('next deadline is the nearest open critical one', () => {
    expect(plan({ motherEmployed: true, bornInHospital: false }).nextDeadline?.id).toMatch(/geburtsanzeige|elternzeit_mutter/);
    expect(plan({}, '2026-12-01').nextDeadline?.id).toBe('elterngeld');
  });

  it('every legal reference links to an official source', () => {
    const p = plan({ parentsMarried: false, singleParent: true, motherEmployed: true, otherParentEmployed: true, needsChildcare: true });
    for (const s of p.steps.filter((x) => x.legalBasis)) expect(s.sourceUrl, s.id).toMatch(/^https:\/\/www\.gesetze-im-internet\.de\//);
  });

  it('rejects future and old dates and unknown fields', () => {
    expect(() => plan({}, '2026-09-01')).toThrow(InvalidBirthSituationError);
    expect(() => plan({}, '2030-01-01')).toThrow(InvalidBirthSituationError);
    expect(() => BirthSituationSchema.parse({ birthDate: '2026-09-15', babyName: 'Mia' })).toThrow();
  });
});
