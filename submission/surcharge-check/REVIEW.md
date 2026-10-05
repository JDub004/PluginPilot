# Surcharge Check: submission material (copy into the OpenAI plugin portal)

## Listing
| Field | Value |
|---|---|
| Display name (≤30) | Surcharge Check |
| Subtitle / short description (≤30) | Audit freight surcharges |
| Developer name (≤80) | PluginPilot *(or your verified name/company; must match the developer identity)* |
| Category | Business & Operations *(pick the closest in the portal)* |
| Website | https://trauerfall-lotse.onrender.com/surcharge |
| Support | https://trauerfall-lotse.onrender.com/support |
| Privacy policy | https://trauerfall-lotse.onrender.com/privacy |
| Terms of service | https://trauerfall-lotse.onrender.com/terms |
| MCP server URL | https://trauerfall-lotse.onrender.com/surcharge/mcp |
| Authentication | None |
| Long description, default prompts, logo, screenshots | see `plugin.json` and `assets/` |

## Test account
Not applicable: the MCP server requires no authentication and has no accounts.

## Positive test cases (exactly 5)
All expected results were produced by running the tool on 2026-10-05 (database 2026-10-04).

| # | Scenario | User prompt | Expected tool | Observable expected result |
|---|---|---|---|---|
| 1 | Maersk surcharges on cargo booked before their effective dates | "Check the surcharges on my Maersk invoice: Emergency Contingency Surcharge 6,000 USD for 2×40HC and Emergency Bunker Surcharge 900 USD for 2×40HC. Hamburg to Sohar, Oman, booked 3 March 2026, sailed 5 March 2026." | check_freight_surcharges | Verdict "dispute recommended", disputable USD 6,900. ECS flagged (effective 06.03.2026, Maersk: cargo in transit not impacted), EBS flagged (effective 25.03.2026; announced USD 800 for 2×40HC). Dispute letter included |
| 2 | War risk surcharge on a lane outside the announced scope | "Hapag-Lloyd charged me a War Risk Surcharge of 3,000 USD on one 40HC from Shanghai to Hamburg booked 1 April 2026. Is that legitimate?" | check_freight_surcharges | Disputable USD 3,000. The line is flagged: the announced Hapag-Lloyd WRS covers Gulf lanes only, not CN→DE |
| 3 | Correctly charged surcharge | "CMA CGM charged an Emergency Conflict Surcharge of 3,000 USD on a 40' dry container from Rotterdam to Jebel Ali, booked 10 May 2026. Is it correct?" | check_freight_surcharges | Verdict "no issues found", disputable USD 0. The line matches the CMA CGM announcement (USD 3,000 per 40' dry, effective 02.03.2026) |
| 4 | Later effective date on a US FMC-regulated trade | "Maersk added a 400 USD Emergency Bunker Surcharge to my 40HC from Shanghai to Los Angeles, booked 1 April and sailed 5 April 2026. Should I pay it?" | check_freight_surcharges | Disputable USD 400. Flagged because FMC-regulated bookings start on 09.04.2026, not 25.03.2026 |
| 5 | Duplicate surcharge on one invoice | "My Maersk invoice for one 40HC from Hamburg to Sohar booked 1 May 2026 shows ECS 3,000 USD and also Emergency Contingency Surcharge 3,000 USD. Is that right?" | check_freight_surcharges | Both lines flagged as possible duplicates; disputable USD 3,000 (the repeated charge) |

## Negative test cases (exactly 3)
| # | Scenario | User prompt | Why the plugin should not act |
|---|---|---|---|
| 1 | Freight quote request | "Find me the cheapest container rate from China to Germany next month." | The plugin audits existing charges; it does not quote or compare freight rates |
| 2 | Parcel shipping | "Are the fuel surcharges on my UPS parcel invoice correct?" | Parcel and courier surcharges are out of scope (ocean container freight only) |
| 3 | Customs duty | "What import duty applies to HS code 8471 into the EU?" | Customs duties and tariff classification are not surcharges and are out of scope |

## Release notes (1.0.0)
First release. One read-only tool, `check_freight_surcharges`, with an MCP Apps widget (traffic-light audit view). Database 2026-10-04: Maersk (ECS North Europe/Med → Middle East, global EBS incl. FMC date, Upper Gulf OCR), Hapag-Lloyd WRS (incl. FMC date), CMA CGM ECS, MSC WRS (Arabian Peninsula → Sub-Saharan Africa/Indian Ocean, gate-in basis), ONE EMS. Every entry carries its source and a confidence level.

## Demo video
Recorded walkthrough: `assets/demo.webm`. Upload it as an unlisted video (e.g. YouTube or Loom) and paste the link into the portal.

## Domain verification
1. The portal shows a token.
2. In Render → service → Environment, add `OPENAI_APPS_CHALLENGE` = the token. Render redeploys.
3. Check https://trauerfall-lotse.onrender.com/.well-known/openai-apps-challenge returns exactly the token, then click *Verify*.
