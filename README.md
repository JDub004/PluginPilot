# PluginPilot: Nebenkosten-Check

A ChatGPT plugin (remote MCP server) that checks German utility statements (*Nebenkostenabrechnungen*) with deterministic rules: deadlines, non-allocable costs, cable TV after 07/2024, allocation math, living area, totals, the HeizkostenV share and the CO2 split.

Why this product: [docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md) · [docs/COMBINATIONS.md](docs/COMBINATIONS.md) · [docs/PRODUCT.md](docs/PRODUCT.md)

```bash
npm ci
npm test          # unit + MCP integration tests
npm run eval      # golden statements + prompt library check
npm run build && npm start   # POST /mcp, GET /health
```

Tool: `check_utility_statement` (read-only). Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Security: [docs/SECURITY.md](docs/SECURITY.md). Deploy: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Not legal advice.
