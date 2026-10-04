# Product: Trauerfall-Lotse

**One-liner:** After a death in the family, ChatGPT gives you a personal, dated plan of every official step, so no deadline that costs money is missed.

| | |
|---|---|
| User | Bereaved relatives in Germany (~1.01M deaths/year, several relatives each) |
| Job | "What do I have to do now, where, with which documents, by when?" |
| Input | Date of death (+ knowledge date), place of death, and yes/no facts (pension, spouse, co-insured, rented flat, car, will, debts, abroad, life insurance, employment) |
| Output | Steps grouped by phase (sofort / erste Woche / erste Wochen / später), each with due date, days left, critical flag, office, documents, reason and legal basis; plus the next critical deadline and a support line |
| Tool | `plan_after_death`: read-only, deterministic, no login |
| UI | Timeline widget (justified: the value is the time sequence and the urgency, which text renders poorly) |

## Roadmap (from the extension discussion)
1. MVP timeline (this release)
2. Benefits for survivors + letter templates
3. Intestate succession + inheritance-tax calculator (§§ 1924 ff. BGB, §§ 16, 19 ErbStG)
4. Vorsorge mode (powers of attorney, living will, funeral wishes)
5. White-label for funeral homes

## Metrics
- North Star: plans created that contain ≥1 still-open critical deadline
- Activation: plan created in the first conversation
- Quality: zero wrong deadline dates (every reported error → regression test)
- Failure: missed-deadline reports from users
