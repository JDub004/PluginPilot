# PluginPilot — permanent rules

Goal: find a painful recurring workflow where ChatGPT is the right interface, build the smallest tool that removes the pain, and distribute it through ChatGPT plus other channels.

1. Always consult the OpenAI Developer Docs MCP (https://developers.openai.com/mcp) for current OpenAI information.
2. Never invent OpenAI APIs.
3. Prefer official OpenAI sources. Current official docs override this file and any prompt.
4. Inspect existing code before modifying it.
5. Keep the architecture simple: a modular monolith, no speculative infrastructure.
6. Use TypeScript strict mode.
7. Validate every external input (Zod). Treat user and document content as untrusted.
8. Never commit secrets.
9. Write tests before declaring functionality complete.
10. Every bug becomes a regression test.
11. Update docs/ when the architecture changes.
12. Never build speculative infrastructure.
13. Never assume a directory listing equals distribution.
14. Validate product demand continuously (see docs/VALIDATION_PLAN.md).
15. Prefer deterministic code over unnecessary LLM calls.

## Repo map
- `docs/` — research and strategy. `docs/OPPORTUNITIES.md` is generated: `node scripts/render-opportunities.mjs`.
- `src/discovery/` — opportunity dataset and scoring (seed of the `/discover` engine).
- `src/domain/trauerfall/` — active product: pure deadline engine (calendar + plan). Bump `RULES_VERSION` and add tests for any legal change.
- `src/domain/geburt/` — Geburts-Lotse (plugin on `/geburt/mcp`), reuses trauerfall calendar + Plan schema.
- `src/domain/surcharge/` — Surcharge Check (`/surcharge/mcp`). `announcements.ts` is the curated DB: every entry needs a source URL and a confidence level; never add amounts or dates without a source. Absence from the DB must never produce a 'flag'.
- `src/domain/softwarecity/` — Software-Stadt (`/city/mcp`, tool `map_software_city`): deterministic town layout + quest rules; widget `web/src/city.html` (canvas, Sims-style). Preview: `npx tsx scripts/preview-city.ts out.html`. Second tool `import_software_list` (`import.ts`); `report.ts` = report, before/after, share link. Share page `/city/view` (data only in URL fragment, built via `POST /city/api/build`, nothing stored); template `/city/vorlage.csv`. Optional `people`, `sites` (own town per site, `geo.ts` coordinates), `partners` (◎ network map).
- `src/site.ts` — public pages (/surcharge, /support, /privacy, /terms, /imprint) rendered from env (OPERATOR_*, CONTACT_EMAIL); `/.well-known/openai-apps-challenge` from OPENAI_APPS_CHALLENGE.
- `submission/` — plugin package + REVIEW.md for the OpenAI portal; rebuild ZIP with `scripts/package-surcharge.sh`.
- `src/domain/nebenkosten/` — archived prototype, not registered.
- `web/src/timeline.html` — MCP Apps widget (vanilla JS, text nodes only). Preview: `npx tsx scripts/preview-widget.ts out.html`.
- `src/tools/`, `src/mcp/`, `src/http.ts` — MCP surface. One primary tool per plugin; plugins are routed by path in `src/http.ts`.
- Commands: `npm test`, `npm run eval`, `npm run typecheck`, `npm run build`.
