# Iran war → shipping costs: problem-solution check (2026-10-04)

## Situation (facts)
- Since **28.02.2026** (US/Israeli strikes on Iran) the Strait of Hormuz has been effectively closed to commercial traffic. Rerouting via the Cape adds 10–20 days. https://www.seavantage.com/blog/strait-of-hormuz-crisis-2026-shipping-disruption-timeline
- Container rates: Asia→US West Coast ~+40 %, Asia→North Europe ~+20 %. War-risk insurance 3–10 % of hull value (before: ~0.25 %). https://www.thenationalnews.com/business/2026/07/17/war-risk-shipping-premium-surges-again-as-tensions-escalate-at-strait-of-hormuz/ · https://www.fairwayeta.com/insights/war-risk-insurance-2026-hidden-cost-shipping
- Surcharge stacks: War Risk up to $1,500/TEU (Hapag-Lloyd), Emergency Conflict $2,000–4,000 (CMA CGM), emergency bunker surcharges (Maersk asked the US regulator for approval), "base freight becoming a minority of total cost". https://www.flexport.com/blog/middle-east-escalation-disrupts-global-ocean-and-air-freight-networks/

## Who suffers most
SMB importers/exporters, e-commerce sellers and small forwarders. They have no freight-audit department, receive invoices above contract with surcharges "buried in small print", and are charged war surcharges on cargo **already in transit** before the surcharge took effect. Pakistan's government stopped this, and Ghana's Shippers' Authority intervened. Disputes are "lost on process, not merit".
https://carraglobe.com/import-freight-bill-higher-than-contract-2026/ · https://propakistani.pk/2026/03/16/govt-stops-shipping-companies-from-imposing-war-fees-on-cargo-already-in-transit/amp/ · https://gnbcc.net/shippers-authority-steps-in-as-war-risk-surcharges-hit-local-businesses/ · https://cargolinked.com/guides/war-risk-and-emergency-surcharges-2026

## Competition
| Job | Who does it | Gap? |
|---|---|---|
| Rates, bookings | Flexport (in the ChatGPT directory), Freightos | Taken |
| Spot rates, landed cost, carrier tariffs | freight-pulse MCP (47 tools), ShippingRates MCP | Taken |
| Enterprise freight audit | Cass, nVision etc. | Not for SMBs, not in ChatGPT |
| **SMB: "Is this surcharge on my quote/invoice legitimate, and how do I dispute it in time?"** | — | **Open** |

## Proposed product: Surcharge Check (freight-bill auditor)
Input: quote or invoice lines (pasted or extracted by ChatGPT) + carrier, lane (POL/POD), booking date, sailing/gate-in date, contract type.
Deterministic checks per line:
1. Classify the surcharge (WRS, ECS, EBS/BAF, PSS, GRI, THC …).
2. Compare with a curated **surcharge announcement database** (carrier, lane scope, amount, effective date; source = carrier advisories).
3. Flags: charged **before the effective date** or on cargo already in transit; lane outside the announced scope; amount above the announcement; **double counting** (e.g. fuel twice); conflicts with a fixed all-in contract; US trades: missing 30-day tariff notice (FMC, 46 CFR 520) unless special permission.
4. Output: avoidable amount, evidence per line, dispute deadline, dispute letter (EN/DE/…).

Why a plugin beats plain ChatGPT: a live, curated announcement database (dates, lanes, amounts), exact date/lane logic, plus a documented dispute workflow.
Moat: the database and anonymised benchmarks of what other shippers actually paid per lane.
Risk: the database needs weekly curation; the crisis may end, but surcharge auditing (GRI, PSS, BAF) stays evergreen.
