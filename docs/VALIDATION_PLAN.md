# Validation Plan

Goal: kill or confirm the recommended winner (Nebenkosten-Check) within **7 days, before writing product code**. The same template applies to GAEB if it is chosen instead.

## Kill criteria (decide by day 7)

| Signal | Continue if | Kill/pivot if |
|---|---|---|
| Real statements analysed manually | ≥10 collected, and ≥30% contain a concrete, rule-backed finding | <15% have findings |
| Intent: "free check" landing page / post | ≥40 sign-ups from ≤3 posts | <10 |
| Willingness to pay | ≥3 of first 20 users say yes to 9–19 EUR for the letter (or actually pay via a pre-sale link) | 0 |
| Legal | A lawyer or legal-tech contact confirms that a rule-based checklist + template letter is RDG-compatible | Requires a licence we cannot get |
| Platform | Docs MCP confirms the tool can receive structured line items (or a file) and that the use case fits the guidelines | Blocked |

## Days 1–2: evidence of pain and language
- Collect 30+ real user phrasings (r/de, r/Finanzen, gutefrage.net, Mieterverein forums, TikTok comments). Store them in `tests/evaluation/prompts.json` as the seed prompt library.
- Get 10 real statements (anonymised) from friends/forums. Check them manually against the rule list in the draft spec.

## Days 3–4: demand test
- A one-page landing page: "Nebenkostenabrechnung in 2 Minuten prüfen — kostenlos". Email capture + upload form (manual processing, concierge MVP).
- 3 posts: r/de or r/Finanzen (follow subreddit self-promo rules), one Mieter Facebook group, one TikTok/Reel showing a real anonymised finding.

## Days 5–7: willingness to pay and legal
- Offer the objection letter for 9 EUR via a payment link to the people who got a finding.
- 30-minute call with a legal contact on RDG scope.

## Metrics (carried into production)
- **North Star:** completed checks that surface ≥1 actionable finding, per week.
- **Activation:** first check completed within 5 minutes of the first prompt.
- **Retention:** user returns next billing season, or checks a second document (e.g. Heizkosten) within 30 days.
- **Revenue:** paid letters/reports ÷ checks with findings.
- **Quality:** % of findings confirmed correct in manual review (target ≥95%).
- **Failure:** false "your statement is fine" verdicts reported by users. The target is zero; every case becomes a regression test.
