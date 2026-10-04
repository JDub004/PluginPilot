# Combinations: what would actually be new?

The owner asked for a combination of the top candidates, keeping what is genuinely innovative. Test applied to each combination: **(1) same user or same data core? (2) does anything like it already exist, in ChatGPT or outside it? (3) does the combination create a moat neither part has alone?**

| Combination | Same user/core? | Exists already? | New moat? | Verdict |
|---|---|---|---|---|
| All three (Nebenkosten + GAEB + E-Rechnung) | No: tenants, construction trades and SMB finance share nothing | n/a | No | **Reject.** A "German paperwork toolbox" is exactly the generic, shallow app the market is full of |
| GAEB X83 → X84 bid → XRechnung final invoice (trades in public construction) | Yes: same user and the same priced line items | **Yes, outside ChatGPT:** T&T GAEB-Konverter converts billed GAEB quantities into XRechnung [1]. In ChatGPT: pyGAEB MCP + Rechnungslotse cover the parts | Weak (a workflow chain only) | New only *as a ChatGPT surface*. Not innovative |
| **Nebenkosten: tenant check + landlord creation on one rule engine** | Yes: the same legal rules (BetrKV, §556 BGB, HeizkostenV, CO2KostAufG) and the same document | **No integrated product found.** Mineko/MieterEngel only check; objego/Vermietet.de/VR only create [2][3] | **Yes: two-sided** | **Recommended** |

## The recommended combo: "Nebenkosten-Engine" (working name)

One deterministic rule engine, two jobs, one link between them:

1. **Tenant: "Ist meine Abrechnung korrekt?"** → rule-backed findings, benchmark comparison (Betriebskostenspiegel), estimated overcharge, objection letter.
2. **Small landlord (1–10 units): "Erstell mir die Nebenkostenabrechnung"** → allocation math (area/persons/consumption), correct HeizkostenV and CO2 split, deadline check, PDF.
3. **The genuinely new part: a verifiable statement.** A statement created with the engine carries a short verification code/link. A tenant who asks ChatGPT "is this correct?" gets an instant "checked against rules version 2026.1, no findings", or the specific deviations. No competitor connects the two sides.

Why this is more than the sum of its parts:
- **Network effect / distribution loop:** every landlord-created statement reaches 1–10 tenants who see the brand; every tenant check shows "landlords: create it correctly here".
- **Retention fix:** the tenant side is annual. The landlord side adds a recurring B2B-ish customer (yearly per unit, plus mid-year tenant changes) and a better fit for subscriptions.
- **Data moat:** anonymised line items from both sides → the best local cost benchmark in Germany.
- **Native-substitution defence:** ChatGPT alone cannot issue or verify a deterministic, versioned rule check, and cannot hold a shared, verifiable record between two parties.

Risks this adds: the landlord side carries liability if our math is wrong (mitigated by deterministic tests from day one). The RDG question now covers both sides.

## MVP scope (still "one primary tool" per side)
- `check_utility_statement` (read-only): structured statement → findings. **Built first**, because it is the activation path for both sides and reuses the whole rule core.
- `create_utility_statement` (read-only computation; returns the document plus a verification code): built in week 2.
- `verify_statement_code` arrives later, once landlords use it.

## Sources
1. Wolters Kluwer on GAEB bids and XRechnung settlement via GAEB-Konverter: https://www.wolterskluwer.com/de-de/expert-insights/angebotsabgabe-gaeb-dateien-oeffentliche-bauausschreibungen
2. Mineko (check only), via Stiftung Warentest: https://www.test.de/Beratung-zur-Mietnebenkostenabrechnung-Das-leistet-das-Angebot-von-Mineko-5867384-0/
3. VR, creating statements (landlord only): https://www.vr.de/privatkunden/themenwelten/wohnen-immobilien/verkaufen-vermieten/nebenkostenabrechnung-erstellen.html
