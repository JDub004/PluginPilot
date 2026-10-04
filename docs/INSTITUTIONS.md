# Research round 3: societal needs and institutions ("think big")

Date: 2026-10-04. Mandate from the owner: look for plugin needs in everyday society, especially for institutions, independent of the owner's own projects.
Method change after the Nebenkosten mistake: **every candidate was checked against consumer search terms and app stores, not only MCP registries.**

## 1. The strongest societal pain signals found

| Signal | Evidence | Source |
|---|---|---|
| Social benefits go unclaimed at scale | BMAS research report (Sep 2025): 12 studies, **non-uptake of 40–88 %**, especially Wohngeld, Kinderzuschlag, Grundsicherung im Alter, SGB II | Bundestag/Bremen documents citing BMAS: https://dserver.bundestag.de/btd/21/041/2104152.pdf · https://ag-familie.de/files/Bruckmeier_2026-AGF.pdf |
| Counselling centres are the bottleneck | Months of waiting; 2026 budget cuts (e.g. 20 positions at Caritas/Diakonie in one district). 86 % of Caritas clients overwhelmed by forms; 42 % blocked by digital application processes | https://www.stuttgarter-zeitung.de/lokales/goeppingen/etatberatung-im-kreis-goeppingen-sozialdienste-warnen-vor-streichplaenen-78879485.html · https://background.tagesspiegel.de/digitalisierung-und-ki/briefing/caritas-digitalisierung-erschwert-zugang-zu-sozialleistungen |
| Institutions are already moving to AI | Caritas NRW is building an AI chatbot for social counselling | same as above |
| Care benefits go unused | Entlastungsbetrag used by under 50 % (Brandenburg); the 3,539 € Entlastungsbudget expires yearly | https://kleineanfragen.de/brandenburg/6/10851-125-entlastungsbetrag-nach-45b-sgb-xi-findet-kaum-anwendung.pdf · https://www.test.de/entlastungsbudget-kurzzeit-und-verhinderungspflege-5333062-0/ |
| Public procurement law is fragmenting | NRW dropped UVgO for municipalities in 2026; the federal UVgO reform cuts 54 → 24 paragraphs; the EU threshold is 216k € from 2026 | https://blog.cosinex.de/2026/06/01/vergaberecht-nordrhein-westfalen/ · https://blog.cosinex.de/2026/07/07/uvgo-reform-2026-neufassung/ |
| Public sector gets ChatGPT | "OpenAI for Germany" (OpenAI + SAP Delos Cloud), planned 2026 for millions of public employees, including custom applications | https://www.techrepublic.com/article/news-openai-for-germany/ |
| The state wants law as code | BMDS: "Law as Code" to become standard by 2028; social law is named as the first domain; the Sozialstaatskommission (Jan 2026) recommends digital social law | https://bmds.bund.de/themen/staatsmodernisierung/law-as-code · https://www.portal-sozialpolitik.de/uploads/sopo/pdf/2026/2026-01-26_BMAS_Empfehlungen_Sozialstaatskommissionl.pdf |

## 2. Competition check (the honest part)

| Idea | Already exists? |
|---|---|
| Pflege budget tracker | **Yes:** PflegePilot (iOS, budget dashboard + expiry alerts), Pflegenda (free, PDFs for the Pflegekasse), nui care (9,99 €/month) |
| Vergabe assistant for buyers | **Yes:** mybits.ai KI-Vergabeassistent; NRW framework contract for AI in procurement; eVergabe platforms |
| Single-benefit calculators | **Yes, many:** dersozialerechner.de (multi-benefit + chatbot), rechner-portal, BA KiZ-Lotse, Wohngeld calculators |
| Council info (OParl) | Developer-grade MCP exists (jtwolfe/oparl-mcp-server, "untested in production") |
| Law-as-code infrastructure | Rulemapping Group (method + planned open-source editor), federal BMDS programme (target 2028) |
| **Benefits engine in ChatGPT / for institutional AI assistants (MCP)** | **Not found for Germany.** The analogue exists in Finland (Kela MCP, open source) |

**Conclusion:** almost every *end-user app* already exists in 2026. What is missing is the **trusted rules layer between the law and the AI assistants** that citizens (ChatGPT) and institutions (Caritas chatbot, municipalities on OpenAI for Germany, care counselling) are starting to use. Every one of these assistants needs exact, versioned, sourced answers to "what is this person entitled to?", and LLMs alone get this wrong.

## 3. Recommendation: "Leistungs-Navigator" as rules-as-code infrastructure

**Vision:** the verified, open, versioned engine for German social benefits, usable as a ChatGPT plugin by citizens and as an MCP/API by institutions. It sits between the 2028 state programme and today's need.

| | |
|---|---|
| Citizen job | "Which benefits am I entitled to, and roughly how much?" Answered in ChatGPT, with the next step (which office, which form, which deadline) |
| Institution job | Counsellors (Caritas, Diakonie, AWO, Pflegestützpunkte, Jobcenter/municipal service desks) get a first assessment before the appointment; institutional chatbots call the same engine |
| Core edge | Deterministic calculation **plus priority rules between benefits** (Wohngeld/Kinderzuschlag take priority over Bürgergeld, Vorrangprüfung), local data (Wohngeld Mietstufen per municipality), every result with § and rules version |
| MVP (1–2 weeks) | Families with low income: **Kinderzuschlag + Wohngeld + priority check against Bürgergeld**. These are the most-cited non-uptake benefits |
| Later modules | Grundsicherung im Alter, BuT, Pflege entitlements (partner with PflegePilot/Pflegenda instead of competing), Elterngeld |
| Monetization | Free for citizens. Revenue from **institutional licences** (welfare associations, municipalities, Pflegekassen), plus **public/foundation funding** (e.g. Prototype Fund, foundations focused on poverty). Later possibly a contractor or partner of the state's law-as-code programme |
| Moat | Correctness track record, rule maintenance (yearly changes), institutional trust and integrations, anonymised aggregate data on non-uptake (policy value) |
| Distribution | Welfare association networks (high trust, many clients), municipalities, press (non-uptake is a political topic), ChatGPT directory as a secondary channel |

**Why this is big:** if the 40–88 % non-uptake shrinks even slightly, billions of euros reach the families they were meant for. Institutions are budget-cut and turning to AI right now, and the state has declared this exact domain its law-as-code priority.

**Why it could fail (keep visible):**
1. **Correctness liability:** a wrong "not entitled" stops someone from applying. Mitigation: never answer "no", only "likely / check with advice"; golden tests per paragraph; show the rules version.
2. **The state builds it:** the BMDS programme could publish official rule code. Mitigation: position as the *consumption layer* (MCP adapter) that adopts official rulemaps as they appear. That makes the state a source, not a rival.
3. **Slow institutional sales:** public and welfare procurement takes months. Funding bridges are needed.
4. **Existing calculators:** dersozialerechner.de already covers several benefits for citizens. Differentiation comes from the ChatGPT/institution channel, the priority logic and sourced versioning, not from "a calculator".
5. **RDG:** benefit information is fine, individual legal advice is not. The welfare associations themselves are allowed to advise, which makes them a natural partner.

## 4. Alternatives ranked
1. **Leistungs-Navigator** (above): biggest societal impact, a real gap in the AI channel.
2. **Vergabe-Navigator for small municipalities:** clear B2G money and 16 fragmented state regimes, but mybits.ai and eVergabe vendors are present.
3. **Ratsinfo/OParl assistant:** civic value, but weak monetization.

## 5. Next step if approved
Interviews with 3–5 counsellors (Caritas/Diakonie/AWO/Verbraucherzentrale) plus one municipality before code: what they calculate by hand, which benefits, and whether they would use or pay. In parallel, a KiZ + Wohngeld engine spike, checked against the official BA and Wohngeld calculators as test oracles.
