# Security & privacy

| Threat | Mitigation |
|---|---|
| Malicious/oversized input | Zod schemas with bounds (≤60 items, string ≤120, amounts ±1M); body limit `MAX_BODY_BYTES` (default 256 KB) → 413 |
| Prompt injection in documents | The server executes no instructions from content; labels are only matched by regex; there are no write actions or outbound calls |
| SSRF / path traversal | No URL fetching and no file system access driven by input |
| Data leakage | No storage; analytics log only tool name, outcome, duration, verdict and counts (an integration test asserts no labels in logs) |
| Error leakage | Internal errors return a generic message; validation errors are truncated to 500 chars |
| Resource exhaustion | Linear-time rules; stateless; place behind a platform rate limiter |
| Secrets | None needed in v1; `.env` is gitignored |
| Unauthorized actions | Tool is read-only (`readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`) |

Personal data: the input contains no names or addresses by design. The tool description tells the model to pass only cost lines and dates. A privacy policy is still required for submission (see LISTING.md).

Legal: output is labelled as an automated rule check, not legal advice (RDG). **Get a legal review before public launch.**
