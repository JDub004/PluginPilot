# Product: Nebenkosten-Check

**One-liner:** Check your German utility statement in two minutes inside ChatGPT: rule-based, with legal references, the euro amount and your objection deadline.

| | |
|---|---|
| Target user (v1) | Tenants in Germany with a Nachzahlung or a statement they don't trust |
| Target user (v2) | Private landlords with 1–10 units (create a statement on the same rule engine). See COMBINATIONS.md |
| Core job | "Is this statement correct and do I have to pay?" |
| Input | Structured line items that ChatGPT extracts from the photo/PDF/text the user shares, plus dates, area and heating data |
| Processing | Deterministic rule engine (`src/domain/nebenkosten`), versioned (`RULES_VERSION`) |
| Output | Verdict, findings (severity, legal basis, euro estimate), total estimated overcharge, objection deadline |
| Primary tool | `check_utility_statement` (read-only) |
| Secondary tools | None in v1. Planned: `create_utility_statement` (landlord), then `verify_statement_code` |
| UI | None in v1. ChatGPT renders the structured result well in text; a widget is only justified for the landlord flow (tables) |

## User journey
1. User: "Mein Vermieter will 640 € nachgezahlt haben, hier ist die Abrechnung" + photo.
2. ChatGPT extracts the lines and calls the tool.
3. The tool returns findings. ChatGPT explains them, errors first, and names the objection deadline.
4. (v1.1) A link to our site for a ready-to-send objection letter and PDF report (paid). See MONETIZATION.md.

## Metrics
| Metric | Definition |
|---|---|
| North Star | Completed checks with ≥1 actionable finding per week |
| Activation | First successful tool call in a conversation |
| Retention | Second check (another year, or the Heizkosten page) within 12 months |
| Revenue | Paid letters/reports ÷ checks with findings |
| Quality | % of findings confirmed correct in manual review (target ≥95%) |
| Failure | Reported false "no issues" verdicts. Every case becomes a golden test |

## Final product test
"I typed in my statement and it found 144 € Verwaltungskosten and 54 € Kabel-TV I didn't have to pay." If real users don't say something like that in validation, don't ship.
