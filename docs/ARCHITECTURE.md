# Architecture

```
ChatGPT ── reads the user's photo/PDF and extracts line items
   │  MCP tools/call (streamable HTTP, POST /mcp, JSON response)
   ▼
src/http.ts        Node http server: /mcp, /health, 404; body size limit; stateless
src/mcp/server.ts  McpServer + instructions; registers tools
src/tools/         check_utility_statement: Zod in/out schemas, annotations, error mapping, analytics
src/domain/        nebenkosten/{schema,categories,co2,check}.ts: pure deterministic rule engine, no I/O
src/analytics/     event sink (stdout JSON); never content
src/config/        Zod-validated env
src/discovery/     opportunity dataset + scoring (strategy tooling, not shipped)
```

Decisions:
- **Stateless transport** (`sessionIdGenerator: undefined`, a new server per request): horizontal scaling, no session store.
- **Structured input instead of file upload:** the model extracts lines, and the server never receives documents or names. This minimises privacy risk and avoids depending on file-passing APIs. *Re-check the current Apps SDK file-input support via the OpenAI Docs MCP before v1.1.*
- **No database in v1.** Nothing to persist. A DB arrives with paid letters/accounts or the landlord side.
- **No UI in v1.** Text output is sufficient; revisit for the landlord tables.
- **Rules are code, versioned** (`RULES_VERSION`). Every legal change → new version + tests.

Stack: TypeScript (strict, TS 7), Node ≥20, `@modelcontextprotocol/sdk` 1.32, Zod 4, Vitest.
