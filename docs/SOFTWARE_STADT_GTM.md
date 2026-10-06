# Software-Stadt: what to optimise and how to sell it (2026-10-05)

## Status
Plugin is final for submission: tool `map_software_city` on `/city/mcp`; futuristic Sims-style widget (glass towers with roof gardens, dome pavilions, skywalks for data flows, plumb-bob status gems, residents); product page `/city`; package `submission/software-stadt-1.0.0.zip`; REVIEW.md with 5+3 verified test cases; demo video; 17 evaluation prompts; 132 tests.

## Competition (honest)
- **SaaS management platforms** (Zylo, Productiv, Torii, Vendr) find tools and spend automatically, but they are enterprise-priced, dashboard-style and not in ChatGPT.
- **Enterprise architecture tools** (SAP LeanIX, Ardoq) are for large IT departments.
- **Free:** an Excel list.

Software-Stadt's position: the understandable, playful picture for people who are **not** IT (managing directors, office managers, new staff), inside ChatGPT, at SMB size.

## Built 2026-10-05 (v1.1)
- **Import:** `import_software_list` parses pasted Excel/CSV lists (German/English headers, `1.234,50`, ja/nein) and accounting/bank exports (~40 SaaS vendors detected in booking texts, cost averaged per month). Template at `/city/vorlage.csv`. Code: `src/domain/softwarecity/import.ts`.
- **Share:** every result has a `shareUrl` (`/city/view#d=…`). The data is in the URL fragment, never stored; the page POSTs it once to `/city/api/build`. No accounts, no database.
- **Before/after:** `before` app list in `map_software_city` → health, cost and solved/new quests.
- **Report:** Markdown report in every result and as a download on the share page; `preparedBy` names the IT service provider (start of the partner tier).
- **Not built, on purpose:** Microsoft 365/Google OAuth (needs app registration, admin consent, secret handling and a DPA; only after paying demand) and the paid partner account (checkout, multi-client storage). Build these when the first IT service provider asks to pay (see validation below).

## Built 2026-10-05 (v1.2)
- **Size = users + importance:** optional `importance` (1-5, default 4 if critical, else 3) adds or removes floors and widens the footprint; 5 gets a gold crown ring.
- **Key persons:** `people` (name, role, department, business e-mail/phone, note, `responsibleFor`). They walk through their district as named figures and can be clicked. New quest `key_person`: one person holds ≥3 programs with ≥2 critical ones and has no deputy in the note.
- **Sites:** `sites` with city or lat/lon. Built-in coordinates for ~150 cities (`geo.ts`, no geocoding call). Each site has its own town layout: apps with `site`, plus company-wide apps, plus unassigned apps at the main site.
- **Partner network:** `partners` (supplier/customer/service provider/authority) with `connectedApps`. Partner names count as known data-flow targets. The ◎ view shows sites and partners on a real-coordinate map; clicking a site jumps into that town.
- Contact data only lives in the tool call and in the share-link fragment. Nothing is stored.

## Built 2026-10-05 (v1.3): work savers
- **Contract deadlines:** `renewalDate` + `noticePeriodDays` (import recognises "Vertragsende", "Kündigungsfrist", German dates, "3 Monate"). The quest `renewal` appears when the notice deadline is ≤90 days away (high if ≤30) or was just missed. It needs `today`, which the tool passes; pure calls without `today` stay date-independent.
- **Ready-to-copy drafts:** every quest has `action {label, draft}` (`actions.ts`): consolidation e-mail, licence reduction request, notice/renegotiation letter, AVV/approval questions, owner nomination, spreadsheet checklist, deputy plan.
- **Werkzeuge tab:** deadline list, software inventory CSV (`inventoryCsv`, also in tool output), emergency contacts, report, all drafts at once. Person panel: offboarding checklist.
- **Report:** new sections Vertragsfristen and Notfall-Kontakte.
- **Surroundings:** ring roads with traffic, street lamps, parks with trees, bushes, benches, pocket parks with fountains in free plots, and a canal.

## Built 2026-10-06 (v1.4): after the Systemhaus simulation (`docs/sim/ERGEBNIS_SIMULATION.md`)
- **Sober table view** (☰): traffic-light table sorted by urgency, totals in euros; for auditors, CFOs and print.
- **Euros instead of a score:** the HUD and report lead with software cost per year, avoidable cost, urgent risks and deadlines; `stats.urgent` and `stats.deadlines`. The health score stays in the data only.
- **Partner branding:** `preparedBy` and `brandColor` are part of the city input (so they survive share links); badge with monogram on the city, "erstellt von" in the report.
- **Excel round trip:** inventory export headers match the import aliases (incl. Vertragsende, Kündigungsfrist, Daten an); tested for loss-free re-import.
- **Privacy:** share links never contain e-mail, phone, notes or partner contacts (`shareSafe`). Draft one-pager and AVV outline in `docs/legal/` (not legally reviewed).

## Optimise next (in this order)
1. **Import instead of typing** (largest lever for activation):
   a) Paste or upload a tool list or invoice export (Excel/CSV). ChatGPT already extracts it into the tool input, so it works today; add a template and test prompts.
   b) Accounting export (DATEV/Lexoffice: recurring software vendors) reveals forgotten paid tools.
   c) Microsoft 365 / Google Workspace admin (licences, users) via OAuth. Bigger build; only after demand is proven.
2. **Save and share the city:** a link for the team or management (needs storage and an account). This is also the paid feature.
3. **Before/after:** close a quest, rebuild, and watch the health score rise. This gives a reason to return monthly.
4. **Report:** a one-page summary (savings, risks, owners) for the management meeting.

## Monetisation (cannot sell inside ChatGPT; checkout on our site)
| Tier | Price hypothesis | Includes |
|---|---|---|
| Free (ChatGPT) | 0 | Build and explore the city, all quests |
| Team | 29–49 €/month | Saved cities, share link, monthly re-check, report, import from accounting |
| Partner (IT service providers) | 99–299 €/month | White-label cities for their clients, multiple companies, branded report |

The partner tier is the most promising: **IT service providers (Systemhäuser, MSPs)** sell licence consolidation and security. A city with red gems is a sales conversation for them, and they bring many end customers.

## First 10 users (no directory needed)
1. 5 IT service providers from your network or LinkedIn: offer a free "city of your client" in a 20-minute call; ask whether they would pay for white-label.
2. 3 SMB managing directors (20–200 staff): build their city live in ChatGPT/the demo and measure how many quests they act on.
3. LinkedIn post with a 20-second screen recording of the city ("Our software as a city: 12,360 €/year savings found"). The visual is the hook.
4. Communities: r/sysadmin and r/msp (English), German IT-Mittelstand groups; IHK digital events.

## Success metrics
- Activation: a city with ≥ 8 programs built in the first session
- Value: ≥ 1 quest marked as relevant or acted on
- Retention: city rebuilt within 30 days
- Revenue signal: ≥ 2 of 5 IT service providers ask for white-label pricing
