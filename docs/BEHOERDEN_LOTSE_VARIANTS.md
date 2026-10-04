# Behörden-Lotse: 5 specific variants

Date: 2026-10-04. Each variant is one **life event** with a fixed chain of official steps and hard deadlines. That is the specific job inside the general "Behörden-Lotse".
Data check: FIM portal full-text search (public API, no key) returns hits for all events (e.g. "Geburt anzeigen", "Wohnsitz anmelden", "Sterbeurkunde", "Gewerbe anmelden", "Fahrzeug ummelden").

| # | Variant | Cases/year (DE) | What goes wrong today (euro risk) | Data | Competition | Institutional partner |
|---|---|---|---|---|---|---|
| 1 | **Trauerfall-Lotse**: "Someone has died, what do I do now?" | **~1.01M deaths** (Destatis 2025) | ~12 notifications per death (Columba). Rente-Sterbevierteljahr must be claimed within 30 days. **Estate disclaimer deadline 6 weeks (§ 1944 BGB)**, and missing it means inheriting the debts. Widow's pension. Cancelling contracts | FIM (Sterbeurkunde, pensions), BGB deadlines | Static checklists (Caritas, insurers); Columba is B2B only via funeral homes | ~4,000 funeral homes, Columba, churches/Caritas, Deutsche Rentenversicherung |
| 2 | **Geburts-Lotse**: "The baby is here, which forms by when?" | **~654k births** (Destatis 2025) | **Elterngeld is paid only 3 months retroactively** (classic loss of thousands of euros); Kindergeld 6 months; birth registration within 1 week; KiZ is often forgotten | FIM + BEEG/EStG rules | Checklists; Bremen-only ELFE; the federal Digital Family Benefits Act (combined application) is coming | Hospitals, midwives, health insurers, municipalities |
| 3 | **Umzugs-Lotse**: "I'm moving to X, what do I need to do at the offices there?" | Millions (large, not quantified here) | Registration 2 weeks (fine), car address, Rundfunkbeitrag, dog tax, childcare place, schools | FIM + municipal specifics (PVOG) | Volders, ImmoScout planner, many checklists (**crowded**) | Municipalities, moving companies/energy suppliers (affiliate) |
| 4 | **Gründungs-Lotse**: "I'm starting X, which registrations and permits?" | **~762k business registrations** (2025) | Trade vs. freelance; tax registration questionnaire; IHK/HWK; **industry permits** (catering, security, crafts) | FIM covers permits per industry | BMWK founder platform, tax tools, guides | Chambers, banks, tax advisers (lead gen) |
| 5 | **Reise-Dokumente-Lotse**: "Is my ID card or child's passport enough for country X, and in time?" | Tens of millions of trips | Wrong document → denied boarding; processing times | Foreign Office OpenData API (travel/entry info; terms: take over fully, cite the source) + FIM (passports) | Foreign Office app, Sherpa, airlines | Travel agencies, citizen offices |

## Assessment (1–5, 5 = best)

| Variant | Euro/deadline stakes | ChatGPT fit (people ask) | Data availability | Competition gap | Institutional channel | Sum |
|---|---|---|---|---|---|---|
| **Trauerfall-Lotse** | 5 | 5 | 4 | 4 | 5 | **23** |
| Geburts-Lotse | 5 | 5 | 5 | 3 | 4 | **22** |
| Gründungs-Lotse | 4 | 4 | 5 | 3 | 4 | 20 |
| Reise-Dokumente-Lotse | 4 | 5 | 3 | 3 | 2 | 17 |
| Umzugs-Lotse | 2 | 4 | 4 | 2 | 3 | 15 |

## Recommendation: Trauerfall-Lotse (alternative: Geburts-Lotse)
- **Why:** high volume (~1M/year, plus several relatives each), extreme time pressure in a state of shock (people ask a conversational assistant, not a form), hard deadlines with large sums at stake (6-week disclaimer, 30-day Sterbevierteljahr), no consumer competitor in ChatGPT, and a strong B2B channel through funeral homes.
- **Plugin edge:** a personal timeline from the date of death and the circumstances (pension recipient? married? debts suspected? car? rented flat?), with exact deadline dates, the responsible office, documents and ready-made letters. Deterministic and with legal sources; no health data and no login needed.
- **Risks:** sensitivity (tone, no sales pressure); legal-advice limits around inheritance (RDG): show deadlines and the next step, refer to the probate court or a lawyer for actual decisions.
- **Geburts-Lotse** is a close second, but the state is digitising exactly this chain (combined application), so absorption risk is higher.

Sources: Destatis births/deaths 2025 https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/04/PD26_146_126.html · business registrations 2025 https://ms-aktuell.de/?p=103263 · Columba (12 notifications per death, 1,500 funeral homes) https://winfuture.de/news,76351.html · ELFE / Digital Family Benefits Act https://familienportal.de/bmbfsfj/aktuelles/alle-meldungen/bundestag-beschliesst-das-digitale-familienleistungen-gesetz-162030 · Foreign Office OpenData https://www.auswaertiges-amt.de/de/open-data-schnittstelle/736118 · FIM API https://fimportal.de/openapi.json
