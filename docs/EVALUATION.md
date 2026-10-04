# Evaluation

## Automated (CI-able)
- `npm test`: 47 unit and integration tests (rules, CO2 stages, deadlines, MCP over HTTP, 413, analytics without content).
- `npm run eval`: golden statements in `tests/evaluation/golden/cases.json` plus a prompt library integrity check.

## Tool selection (manual, in ChatGPT developer mode)
`tests/evaluation/prompts.json` holds 54 prompts: direct 10, indirect 12, follow-up 8, negative 10, boundary 8, ambiguous 6. Each has an `expected` value: `call`, `no_call`, `call_or_answer` or `answer_or_ask`.

Procedure per release of the tool description:
1. Connect the dev server (DEPLOYMENT.md) in ChatGPT developer mode.
2. Run each prompt in a fresh chat and record `id, called (y/n), success (y/n), quality 1-5, latency_s, notes` in `tests/evaluation/results/<date>.csv`.
3. Targets: direct/indirect selection ≥90%, false activation on negative/boundary ≤5%, error rate ≤2%, findings correct ≥95%.

These are not automated, because selection depends on ChatGPT's own model; simulating it with another model would measure the wrong thing.

## Known limitations
- Item classification is keyword-based. Unusual labels become "unclear" warnings (safe direction).
- Benchmarks (Betriebskostenspiegel) are not compared yet; only cost per m² is reported. Adding them needs verified DMB data.
- The estimated overcharge sums findings and can double-count when a late statement also contains wrong items.
