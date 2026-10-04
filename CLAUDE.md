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
