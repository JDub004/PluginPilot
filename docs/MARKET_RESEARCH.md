# Market Research — PluginPilot

Status: Phase 0–4 complete (research, 50 opportunities, shortlist, disproval). **Winner is a recommendation pending owner decision.**
Date: 2026-10-04. Labels: **[FACT]** sourced claim · **[INF]** inference from facts · **[HYP]** hypothesis to test.

---

## 1. Executive summary

- **[FACT]** As of 2026-07-09 the ChatGPT app directory became the **Plugin directory**. A plugin bundles apps (MCP-backed integrations), skills and app templates, and is available in ChatGPT web/desktop, ChatGPT Work and Codex. New app submissions are packaged as plugins. [S1][S2]
- **[FACT]** The recommended build is a **remote MCP server**, optionally with skills and a UI returned from tools. [S3]
- **[FACT]** Guidelines allow selling **physical goods only** inside ChatGPT. Digital products and subscriptions cannot be sold in ChatGPT, and checkout cannot be embedded in the plugin UI. Users *may* connect existing paid accounts. [S4][S5] → **[INF]** Monetization has to happen on our own website (freemium account, credits, paid report), with ChatGPT as the acquisition/activation surface.
- **[FACT]** The ecosystem is crowded and shallow: ~2,000–2,300 ChatGPT apps in Aug 2026, 95.6% of developers have one app, 5 categories hold 73% of listings. [S6][S7]
- **[FACT]** Directory presence does not equal distribution: users don't know apps exist, discovery is weak and adoption has been called sluggish. [S8] Only ~5% of MCP servers in registries also appear in the stores, and in travel only 33% of registered servers had a working endpoint. [S7]
- **[INF]** Generic "API → MCP" wrappers are already commoditised. For almost every obvious data source we checked (VIES, TED tenders, e-invoicing, GAEB) **at least one MCP server already exists**. A new product wins on **workflow depth for one painful job plus distribution outside ChatGPT**, not on access to data.
- **Recommendation:** **Nebenkosten-Check**, a German tenant tool that audits the annual utility/service-charge statement (*Nebenkostenabrechnung*) with deterministic rules and benchmarks and produces an objection letter. Runner-ups: **GAEB-LV-Assistent** (B2B construction) and **E-Rechnung-Eingangsprüfung** (B2B SMB). Evidence strength: **moderate**. See §15.

## 2. Current ChatGPT plugin / app platform (Tier 1)

| Topic | Current state | Source |
|---|---|---|
| Unit of distribution | Plugin = apps + skills + app templates. The directory replaced the app directory on 2026-07-09 | [S1][S2] |
| Surfaces | ChatGPT web, desktop, ChatGPT Work, Codex | [S2] |
| Tech | Remote MCP server (tools), skills for repeatable workflows, optional UI component returned by tools | [S3] |
| Tool annotations | `readOnlyHint`, `destructiveHint`, `openWorldHint` are required and must be accurate | [S4] |
| Privacy | Published privacy policy, data minimisation. No collection of payment cards, health records, government IDs or credentials | [S4] |
| Quality | Clear purpose, reliable behaviour, no trial/demo-only apps, no degraded copy of an experience available elsewhere | [S4] |
| Commerce | External checkout recommended. Instant Checkout is beta for physical goods only. Digital goods and subscriptions cannot be sold in ChatGPT | [S4][S5] |
| Submission | Review against the guidelines. Test credentials are required for authenticated servers | [S4] |

Caveat: the OpenAI Developer Docs MCP (`https://developers.openai.com/mcp`) is **not configured in this cloud session**. Docs were read over HTTPS instead. Some deep pages returned 404 because the docs moved under `/plugins/` and `/apps-sdk/`. **Before Phase 7, configure that MCP and re-check:** file inputs to tools (can a user-uploaded PDF be passed to our tool?), the auth spec, and the current submission checklist.

## 3. Market size and growth (Tier 2–3)

| Metric | Value | Source | Note |
|---|---|---|---|
| ChatGPT apps (89-country union) | 2,049 (Aug 2026) | [S7] | Single country sees 1,735–1,895 |
| Installable apps / developers | 2,289 / 2,007 | [S6] | Different method |
| Later census | >4,000 listings, >3,600 vendors (Sep 2026) | brief, unverified | **Not verified.** Probably counts plugins/templates after the migration |
| Claude connectors | 1,375, with +584 in July 2026 | [S7] | Competing surface, same MCP server can serve both |
| Single-app developers | 95.6% | [S6] | |

**[INF]** Numbers differ by up to 2× depending on method and date. The direction is clear (fast growth in supply) but there is **no public demand data** (installs/usage). Treat every "big market" claim as unproven.

## 4. Competitive landscape and categories

Largest categories: Business & Operations (399–440), Productivity (382), Travel (228), Finance (211), Developer tools (126). Smallest: Security 19, Communication 24, Healthcare 53, Creativity 88, Data & Analytics 89. [S6][S7]

**[INF]** "Few apps in category" ≠ opportunity. Security and Healthcare are small partly *because* guidelines restrict sensitive data. The real gap is **depth**: most listings are shallow, read-only fronts for existing SaaS. [S6]

## 5. Native-substitution risk

- **[FACT]** ChatGPT already reads PDFs and spreadsheets and runs code. Excel/Copilot Agent Mode (GA Jan 2026) builds, cleans and merges spreadsheets natively. [S9]
- **[FACT]** People already ask ChatGPT to check their Nebenkostenabrechnung. Guides describe this as "a cheap first orientation, not a legally reliable check". [S10]
- **[INF]** Any idea whose value is "extract/summarise/compare documents" is at high absorption risk (minutes formatter, email reply, RFQ compare, CSV cleanup). They were scored low on `native`.
- **[INF]** Durable plugin advantages: (a) **deterministic legal/financial rule engines** where the LLM is unreliable (deadlines, allocation math, CO2 split), (b) **maintained reference data** (benchmarks, thresholds, rates), (c) **valid special output formats** (XRechnung, GAEB X84, SEPA XML), (d) **actions and state** (sending a letter, a tracked case).

## 6. Distribution risk

- **[FACT]** Directory discovery is weak and users mostly don't know apps exist. [S8]
- **[INF]** Pick a problem with **its own search demand and social virality** (SEO, TikTok, Reddit, consumer press) so the ChatGPT plugin is the *best place to do the job*, not the only way to find it.

## 7. User pain — evidence for the shortlisted problems (Tier 2–4)

| Problem | Evidence | Source |
|---|---|---|
| Nebenkostenabrechnung wrong | Mieterbund: "almost every second statement contains errors". Average recoverable amount ~280 EUR (DMB) or 317 EUR (ImmoScout24 check) | [S11][S12] |
| Tenants pay to have it checked | Mineko 49–89 EUR per check (Stiftung Warentest reviewed it) | [S13] |
| E-Rechnung receipt | Mandatory receipt since 2025-01-01, also for Kleinunternehmer. XML is "unreadable code" in an editor. Issuance mandatory >800k EUR revenue from 2027, everyone from 2028 | [S14][S15] |
| GAEB files | Trades receive X83 tender files they cannot open without AVA software. Free viewers exist, but pricing and X84 export need paid tools | [S16][S17] |
| Quotes for trades | Trades spend hours per quote in Excel (vendor-sourced, weak evidence) | [S18] |
| Bank reconciliation | Two of three inherited SMB books are months behind (vendor blog, weak) | [S19] |

Gap: Reddit/HN threads were not retrievable through the search tool in this session (US-only search, little German-language Reddit). **Gathering real user language is the first validation task (VALIDATION_PLAN.md).**

## 8. Competitor check for API-style ideas (disproval evidence)

| Idea | Existing MCP / ChatGPT competitors | Verdict |
|---|---|---|
| EU VAT check | vatnode MCP, VIES connector (anythingmcp), VIES Smoother, pipeworx [S20] | Commodity |
| Public tenders | **Tenqual is listed in the ChatGPT plugin directory**. LexSocket, TenderAPI, EU Tender MCP, Apify. Vergabepilot has a free plan [S21][S22] | Crowded → demoted despite top raw EV |
| E-invoice create/validate | Rechnungslotse (18 tools, KoSIT validation, 3 free/month), Scribo (free), InvoiceXML [S23] | Crowded → demoted |
| GAEB | pyGAEB MCP (Python, stdio, dev-oriented). BauGPT exports GAEB [S24] | Moderate, no consumer-grade ChatGPT plugin found |
| Nebenkosten audit | Mineko (web service, 49–89 EUR), Mietervereine, generic ChatGPT. **No ChatGPT plugin or MCP found** [S10][S13] | Open |

## 9. Monetization opportunities

Because subscriptions and digital goods cannot be sold in ChatGPT [S4], the model is: **free result in ChatGPT → link to our site → paid deliverable** (letter, PDF report, case tracking, B2B account). Per-use pricing fits low-frequency consumer jobs. Subscriptions fit B2B recurring jobs (GAEB, E-Rechnung). Details: MONETIZATION.md (written after the decision).

## 10. Regulatory and privacy risks

- **Rechtsdienstleistungsgesetz (RDG):** a tool must not give individual legal advice without a licence. Mitigation: present results as a rule-based checklist with sources, include a "not legal advice" note, and send people to Mieterverein/lawyer for disputes. Partner with a licensed provider for the letter as a later step. **Needs a legal opinion before launch.**
- **DSGVO:** statements contain names and addresses. Process in memory, do not store documents, redact PII before logging.
- **Platform:** OpenAI's prohibited data list (IDs, health, credentials) is not triggered by a utility statement. [S4]

## 11. Technical barriers

- **File handover from ChatGPT to the tool is the main open technical question** (PDF/photo upload → tool). Fallback: ChatGPT extracts line items and passes structured JSON to the tool. The deterministic checks still run server-side. Verify in the docs MCP.
- The reference data (Betriebskostenspiegel, CO2KostAufG classes, HeizkostenV ranges) is public, small and changes yearly. Easy to maintain.

## 12. Opportunities

All 50 opportunities with scoring are in **[OPPORTUNITIES.md](OPPORTUNITIES.md)**, generated reproducibly from `src/discovery/opportunities.mjs`.

## 13. Shortlists (by EV, then adjusted by disproval)

**Top 10 by raw EV:** 1 Tender finder (68) · 2 GAEB-LV-Assistent (64) · 3 E-Rechnung erstellen (63) · 4 Nebenkosten-Check (62) · 5 E-Rechnung lesen & prüfen (59) · 6 EU cross-border VAT checker (57) · 7 Nebenkostenabrechnung erstellen (56) · 8 BFSG accessibility check (56) · 9 Förderprogramm finder (55) · 10 HS/customs code finder (54)

**Disproval adjustments:** Tender finder and E-Rechnung erstellen are demoted. A ChatGPT-listed competitor plus several free MCPs means competition is effectively 1/5, which cuts their EV to about 58 and 57. The VAT checker is demoted for the same reason.

**Top 5 (adjusted):** 1 Nebenkosten-Check · 2 GAEB-LV-Assistent · 3 E-Rechnung lesen & prüfen · 4 Tender finder (niche: DACH trades) · 5 BFSG accessibility check

**Top 3:**

### A. Nebenkosten-Check (tenants, DE)
- **Why it could work:** ~half of statements are wrong and ~280–317 EUR is recoverable on average [S11][S12]. People already ask ChatGPT this exact question [S10]. The incumbent charges 49–89 EUR [S13]. Deterministic checks (12-month period, §556(3) BGB deadline, non-allocable items like Verwaltung/Reparatur, HeizkostenV 50–70% consumption share, CO2KostAufG 10-step split, benchmark against Betriebskostenspiegel) are things an LLM gets wrong. Huge seasonal SEO/TikTok demand. Money-back framing goes viral easily.
- **Why it could fail:** frequency is about once a year, so retention is weak. RDG legal limits. Many users are happy with a free ChatGPT answer. Photo/PDF input quality varies. The German-only market caps size.
- **What must be true:** ≥30% of checks find a concrete, explainable issue. ≥5% of users pay 9–19 EUR for the letter/report. The plugin passes review.
- **24h validation:** run 10 real statements (Mieterverein forums, friends) through a manual rule checklist and count real findings. Post a "free check" offer in r/de, r/Finanzen and Mieter Facebook groups and measure sign-ups.
- **MVP:** one tool `check_nebenkostenabrechnung(structured line items + metadata)` → findings with legal reference, benchmark deltas and estimated overcharge. Plus an optional letter generator. 3–5 days.
- **First 10 users:** friends/family, Mieterverein-adjacent forums, r/de, a TikTok demo "Ich habe 312 € zurückgeholt", local Facebook Mieter groups.
- **Monetize:** free check, 9–19 EUR objection letter + PDF report on our site. Later: B2B for Mietervereine/legal-insurance (white-label).
- **Moat:** an anonymised dataset of real statement line items → the best "is this normal for my city/building?" benchmark in Germany. Later a landlord-side product (the same rules, used to create statements).

### B. GAEB-LV-Assistent (small construction trades)
- **Why it could work:** a recurring B2B job (every tender). Proprietary format, high WTP, only a dev-grade MCP exists [S24].
- **Why it could fail:** trades rarely work inside ChatGPT. The file-upload path is uncertain. Incumbent AVA tools are entrenched. Format edge cases (GAEB 90/2000/XML) need a long tail of work.
- **24h validation:** call or email 10 Handwerksbetriebe or an Innung, and ask how they handle X83 today and whether they'd pay 19 EUR/month.
- **Moat:** a price database from users' past X84 bids.

### C. E-Rechnung lesen & prüfen (SMB inbox)
- **Why it could work:** a legal mandate with a recurring job (every incoming invoice).
- **Why it could fail:** Rechnungslotse already does this over MCP, with free tiers. Accounting suites absorb it. **Weakest differentiation.**

## 14. Disproval attempt summary

| Candidate | Strongest counter-evidence | Survives? |
|---|---|---|
| Nebenkosten-Check | ChatGPT is already used for this [S10]. Annual frequency. RDG | **Yes, conditionally.** The plugin edge (rules + benchmarks + letter) is concrete, and frequency is offset by per-use pricing and SEO |
| GAEB | pyGAEB MCP, BauGPT [S24]. Low ChatGPT usage among trades | Yes, weaker on ChatGPT fit |
| E-Rechnung inbox | Rechnungslotse, InvoiceXML, accounting suites [S23] | Barely. Differentiation unclear |
| Tender finder | Tenqual in the ChatGPT directory, 4+ MCPs [S21][S22] | No |

## 15. Winner (recommended) and reasons against

**Nebenkosten-Check.** It has the best combination of documented pain with a euro amount attached, existing proof that people bring this question to ChatGPT, a concrete deterministic edge, no ChatGPT-native competitor, a 3–5 day MVP and distribution outside ChatGPT.

**Reasons against (kept visible):** low frequency; the legal grey zone under the RDG; a German-only market; possible OpenAI absorption of "document checking" for the generic part (but not the maintained German legal rules and benchmarks).

**If the owner prefers B2B recurring revenue over B2C virality, choose GAEB-LV-Assistent.**

## 16. Validation plan

See [VALIDATION_PLAN.md](VALIDATION_PLAN.md).

## Sources

- [S1] OpenAI Help — Plugins in ChatGPT and Codex: https://help.openai.com/es-419/articles/20001256-plugins-in-chatgpt-and-codex (Tier 1)
- [S2] OpenAI Help — Plugin use cases: https://help.openai.com/pt-br/articles/12084614-plugin-use-cases-and-prompts (Tier 1)
- [S3] OpenAI Apps SDK / Plugins docs: https://developers.openai.com/apps-sdk (Tier 1)
- [S4] OpenAI app submission guidelines: https://developers.openai.com/apps-sdk/app-submission-guidelines (Tier 1)
- [S5] OpenAI monetization docs: https://developers.openai.com/apps-sdk/build/monetization ; Shopifreaks on scaled-back commerce: https://www.shopifreaks.com/openai-scales-back-its-integrated-commerce-plans/ (Tier 1/4)
- [S6] node8.ai State of ChatGPT Apps: https://node8.ai/state-of-chatgpt-apps (Tier 3)
- [S7] Nicolas Sitter, MCP Apps Census 2026: https://nicolassitter.com/research/mcp-apps-census-2026 (Tier 3)
- [S8] Ben's Bites on sluggish adoption: https://news.bensbites.co/posts/62465 ; OpenAI submission announcement: https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/ (Tier 1/4)
- [S9] Excel Agent Mode GA: https://thesignal.substack.com/p/agent-mode-in-excel-is-a-powerhouse (Tier 4)
- [S10] ki-syndikat, ChatGPT Nebenkostenabrechnung prüfen: https://www.ki-syndikat.de/ki-privat/alltag/chatgpt-nebenkostenabrechnung-pruefen/ (Tier 5, used only as intent evidence)
- [S11] Finanztip press release: https://www.finanztip.de/presse/nebenkostenabrechnung-fehler-koennen-mieter-hunderte-euro-kosten/ ; ING: https://www.ing.de/wissen/nebenkostenabrechnung-pruefen/ (Tier 3)
- [S12] ImmoScout24, avg 317 EUR recovered: https://www.immobilienscout24.de/unternehmen/news-medien/news/default-title/nebenkostenabrechnung-pruefen-lassen-und-im-schnitt-317-euro-zurueckholen/ (Tier 2)
- [S13] Stiftung Warentest on Mineko: https://www.test.de/Beratung-zur-Mietnebenkostenabrechnung-Das-leistet-das-Angebot-von-Mineko-5867384-0/ (Tier 3)
- [S14] Stripe — E-Rechnungspflicht: https://stripe.com/de-ch/resources/more/mandatory-electronic-invoicing-germany (Tier 2)
- [S15] XRechnung öffnen: https://invoicedataextraction.com/blog/xrechnung-xml-oeffnen (Tier 5, context only)
- [S16] Streit Software, GAEB-Datei: https://www.streit-software.de/wissen/gaeb-datei (Tier 2)
- [S17] GAEB-Viewer (softguide): https://www.softguide.de/programm/gaeb-oenorm-viewer (Tier 2)
- [S18] Trade2Base estimating: https://www.trade2base.com/blog/estimating-software-for-tradespeople-uk (Tier 5)
- [S19] imagetotable on reconciliation: https://imagetotable.ai/blog/small-business-bank-reconciliation-problem (Tier 5)
- [S20] vatnode MCP: https://glama.ai/mcp/servers/vatnode/vatnode-mcp ; https://anythingmcp.com/guides/connect-vies-vat-to-chatgpt (Tier 2)
- [S21] Tenqual in ChatGPT: https://chatgpt.com/plugins/plugin_asdk_app_6a874185081c8191a9c8b14bd35a34ea (Tier 2)
- [S22] LexSocket TED MCP: https://glama.ai/mcp/servers/lexsocket/mcp-tenders ; TenderAPI MCP: https://pypi.org/project/tenderapi-mcp/ ; TED API docs: https://docs.ted.europa.eu/api/latest/index.html (Tier 1/2)
- [S23] Rechnungslotse MCP: https://mcpservers.org/servers/xkallex/rechnungslotse-mcp ; Scribo: https://glama.ai/mcp/servers/mn5r1c8uk3 (Tier 2)
- [S24] pyGAEB MCP: https://pygaeb.readthedocs.io/en/latest/guides/mcp-server/ ; BauGPT GAEB export: https://www.baulinks.de/webplugin/2026/0937.php4 (Tier 2)
