# Demand Analysis: what people really ask ChatGPT, and where a plugin gets seen

Date: 2026-10-04. Owner's question: *What is in demand, what is innovative, and what will ChatGPT itself surface, so that as many people as possible use the plugin without downloading anything? Evaluate it statistically.*

Reproducible: `node -e "import('./src/discovery/demand-supply.mjs').then(m=>console.table(m.analyse()))"` and `node scripts/sensitivity.mjs`.

---

## 1. How a plugin reaches people in ChatGPT (the "algorithm")

| Finding | Status | Source |
|---|---|---|
| ChatGPT **suggests apps in the conversation** when they fit the task (example: a home-buying chat surfaces Zillow) | FACT | OpenAI Help "Apps in ChatGPT" (via search): https://help.openai.com/en/articles/11487775-apps-in-chatgpt · https://openai.com/index/introducing-apps-in-chatgpt/ |
| Nothing is downloaded. The plugin runs on our server. On first use the user confirms **"Connect" once**, and a plugin without login needs **no account at all** | FACT | same + https://developers.openai.com/apps-sdk |
| Whether and when a tool is chosen depends on its **name, description, parameter descriptions and annotations** | FACT | https://developers.openai.com/apps-sdk/guides/optimize-metadata |
| Ranking signals for suggestions (usage, ratings, quality) are **not public** | FACT (no public documentation) | same |
| The directory is not a strong channel; most users don't know apps exist | FACT | MARKET_RESEARCH.md [S8] |

**Conclusion [INF]:** what gets seen is not a matter of "ranking tricks". It comes down to three levers:
1. **Match the most frequent intents.** The more conversations fit the plugin's job, the more often ChatGPT can suggest it.
2. **Zero friction.** No login, no personal data, so the user just confirms and it works.
3. **A clear, precise description** written in the words people actually use.

## 2. Demand: what 900M weekly users ask

Basis: OpenAI/Harvard NBER paper w34255, 1.1M classified conversations, May 2024–Jun 2025 (https://www.nber.org/papers/w34255). Reach: **900M WAU** (OpenAI, Feb 2026: https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users), **2.5bn messages/day** (paper). 73 % of usage is non-work.

| Topic | Share of all messages | Source |
|---|---|---|
| Practical Guidance (total) | ~29 % | paper |
| ↳ Tutoring/Teaching | 10.2 % | paper |
| ↳ How-to advice | 8.5 % | paper |
| ↳ Health, fitness, self-care | 5.7 % | paper (via secondary sources) |
| ↳ Creative ideation | ~4.6 % | derived (residual) |
| Seeking Information (total) | ~24 % | paper |
| ↳ Specific info (search substitute) | ~21 % | derived (24 − products − cooking) |
| ↳ Purchasable products | 2.1 % | paper (via secondary sources) |
| Writing (total) | ~24 % | paper |
| ↳ Edit/critique | 10.6 % | paper |
| ↳ Personal writing/communication | 8.0 % | paper |
| Technical Help: programming 4.2 %, math 3 %, data 0.4 % | ~5 % | paper |
| Multimedia | ~7 % | paper |
| Self-expression | 2.4 % | paper |

## 3. Supply: apps per directory category (n = 2,289, Aug 2026)

Business & Ops 440 · Productivity 388 · Other 349 · Finance 253 · Travel 232 · Education 136 · Dev Tools 128 · Entertainment 90 · Data & Analytics 89 · Creativity 88 · **Healthcare 53** · **Communication 24** · Security 19. Source: https://node8.ai/state-of-chatgpt-apps

## 4. Model: addressable demand per competing app

`addressable = messages/week × topic share × tool lift`, where tool lift is the share of a topic's conversations in which an external tool clearly beats native ChatGPT: exact rules, fresh/official data, or actions. `gap = addressable / number of competing apps`, scaled 0–100.

| Topic | Addressable msgs/week | Competing apps | Gap index |
|---|---|---|---|
| **Health / self-care** | 449M | 53 | **100** |
| **How-to advice** | 446M | 67 | **78** |
| **Specific info (search substitute)** | 1,838M | 277 | **78** |
| Cooking | 32M | 5 | 78 |
| Personal communication | 140M | 24 | 69 |
| Multimedia / creative | 368M / 81M | 72 / 16 | 60 |
| Tutoring | 446M | 136 | 39 |
| Programming | 294M | 128 | 27 |
| Calculation (finance) | 315M | 253 | 15 |
| Shopping | 294M | 440 | 8 |
| Edit/translate/relationships | small | many | ≤ 4 |

**Robustness (Monte Carlo, 10,000 runs; tool lift ±50 %, shares ±15 %, supply ±20 %):**

| Topic | P(rank 1) | P(top 3) | Median rank |
|---|---|---|---|
| Health / self-care | 53.8 % | 64.8 % | 1 |
| How-to advice | 15.4 % | 60.9 % | 3 |
| Specific info | 4.8 % | 50.5 % | 3 |
| Personal communication | 15.3 % | 35.0 % | 5 |
| Tutoring | 0.8 % | 5.0 % | 8 |
| Shopping, editing, translation | 0 % | 0 % | ≥ 11 |

**[INF]** The gaps hold up even under strong assumption changes: **health, practical how-to and fact questions with official or local data**. Text tasks (editing, translating) are worthless for plugins because native ChatGPT already solves them. Shopping is oversupplied.

**Limits:** tool lift is an expert estimate (hence the simulation). Topic shares are from 2024/25 and global, not Germany-specific. Supply counts listings, not usage.

## 5. Counter-check of the top gap

- **Health:** OpenAI launched **ChatGPT Health** itself on 2026-01-07 (Apple Health, MyFitnessPal, Peloton, medical records) (https://openai.com/index/introducing-chatgpt-health/). Doctolib connects health data to ChatGPT (https://www.caducee.net/actualite-medicale/16814/doctolib-accelere-dans-l-ia-clinique-avec-un-laboratoire-dedie.html). Guidelines also forbid collecting health records. → **The platform owner and incumbents are absorbing this gap. Not a target for us.**
- **How-to + specific info, in the public-administration area:**
  - An open data source exists: the **FIM portal API** with **47,626 official service descriptions** (registering a residence, ID card, car, business…), publicly accessible, tested on 2026-10-04 (https://fimportal.de/openapi.json).
  - **PVOG** adds the locally responsible office. It needs registration with FITKO, since API v3 returns 401 without credentials (https://docs.fitko.de/resources/pvog-suchdienst-api/).
  - **Competition:** only a Berlin-only developer MCP (service.berlin.de) and B2G tools for staff (DeutschlandGPT). **No nationwide ChatGPT plugin found** (search 2026-10-04, consumer terms + MCP registries).

## 6. Result: candidates ranked by reach × feasibility × novelty

| # | Candidate | Intent cluster (gap) | Reach | Login needed? | Competition | Platform-absorption risk |
|---|---|---|---|---|---|---|
| **1** | **Behörden-Lotse:** "What do I need to do at which office, with which documents, by which deadline?" | How-to + specific info (78/78) | Everyone, several times a year (moving house, ID, car, birth, business) | **No** | Only Berlin-only MCP | Low (needs official German data) |
| 2 | Pflege-Budget-Lotse | Health/practical (100) | ~5M care households | No | PflegePilot, Pflegenda, nui | **High** (ChatGPT Health) |
| 3 | Leistungs-Navigator (social benefits) | How-to + calculation | Millions, high benefit | No | Calculator sites | Low, but high correctness risk |
| 4 | Tender / GAEB / E-invoice | Technical/business | Niche B2B | Partly | Crowded | Low |

**Recommendation: Behörden-Lotse.**
- **Statistically** it sits in the two robust top clusters (how-to + specific info, together ~30 % of all ChatGPT messages) instead of the one that OpenAI itself is occupying.
- **Visibility without download** comes from no login, no personal data and a high frequency of matching questions, which gives the best odds for in-conversation suggestions.
- **Innovation:** the first nationwide link between the federal government's official FIM/PVOG data and ChatGPT.
- **Institutions:** municipalities, the 115 service centres and the planned "OpenAI for Germany" can use the same server. That gives a revenue path through licences, while citizens use it free.
- **Logical extension:** the Leistungs-Navigator (#3) as a second module ("which benefits, which office").

**Risks:** monetization on the citizen side is weak, and municipalities buy slowly. Data quality differs by state. PVOG access needs approval. ChatGPT's own web search answers part of this, so the advantage is **binding, official and complete** answers (documents, deadlines, fees, online-service link, responsible office) instead of web snippets.
