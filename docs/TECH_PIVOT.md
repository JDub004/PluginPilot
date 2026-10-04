# Technical, international topic: candidate check (2026-10-04)

Owner request: something more technical and internationally applicable than German life events.

| Candidate | Demand driver | Competition (checked) | Verdict |
|---|---|---|---|
| Email deliverability (SPF/DKIM/DMARC) | Google/Yahoo 2024, Microsoft 05/2025 bulk-sender rules | CaptainDNS (MCP **with ChatGPT widgets**), dnsdoctor, DMARKOFF, MXToolbox | Crowded |
| Website accessibility audit (WCAG, axe-core) | 3,117 US federal web-ADA suits in 2025 (+27 %), EAA enforcement 2026 | 5+ axe-core MCP servers, accessiBe, WAVE | Crowded |
| **Stack-Check: dependency security + end-of-life + SBOM** | **EU Cyber Resilience Act: vulnerability reporting since 11.09.2026; SBOM + CE marking from 11.12.2027**; US SBOM practice; LLM training cutoff makes CVE/EOL answers stale | Snyk/Socket (enterprise, IDE/CI), dev-grade EOL MCP and OSV MCPs (local stdio). **No no-login ChatGPT plugin found that combines vulns + EOL + SBOM from a pasted manifest** | **Recommended** |

## Why Stack-Check
- **Native substitution is impossible.** CVEs and end-of-life dates change daily, and ChatGPT's knowledge has a cutoff. Live data: OSV.dev (verified: lodash 4.17.15 → 6 advisories) and endoflife.date (verified: Node.js cycles). Both are free and need no key.
- **Specialised output.** A CycloneDX SBOM (JSON standard), which is exactly what the CRA asks for.
- **Least crowded category:** Security has 19 of 2,289 directory apps (node8.ai).
- **International:** npm, PyPI, Maven, Go, Cargo, NuGet, Docker base images; English-first.
- **Frequent and technical:** every project, every dependency update, every inherited codebase.

Sources: CRA dates https://www.noze.it/en/insights/cyber-resilience-act-sbom/ · ADA suits https://accessibilitychecker.org/blog/ada-website-compliance-lawsuits · CaptainDNS https://www.captaindns.com/en/blog/mcp-captaindns-widgets-chatgpt · EOL MCP https://glama.ai/mcp/servers/ducthinh993/mcp-server-endoflife · OSV API https://api.osv.dev · endoflife.date API https://endoflife.date/docs/api
