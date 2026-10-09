# ChatGPT-Ads-Check: submission material (copy into the OpenAI plugin portal)

## Listing
| Field | Value |
|---|---|
| Display name (≤30) | ChatGPT-Ads-Check |
| Subtitle (≤30) | Startklar für ChatGPT-Werbung? |
| Developer name | PluginPilot *(must match your verified developer identity)* |
| Category | Business & Operations |
| Website | https://trauerfall-lotse.onrender.com/ads |
| Support | https://trauerfall-lotse.onrender.com/support |
| Privacy policy | https://trauerfall-lotse.onrender.com/privacy |
| Terms of service | https://trauerfall-lotse.onrender.com/terms |
| MCP server URL | https://trauerfall-lotse.onrender.com/ads/mcp |
| Authentication | None |

## Test account
Not applicable: no authentication, no accounts. Reviewers can use the demo pages on our own domain, so no third-party site is needed.

## Positive test cases (exactly 5)
Expected results produced by running the tool code on 2026-10-09.

| # | Scenario | User prompt | Expected tool | Observable expected result |
|---|---|---|---|---|
| 1 | Reachable landing page with a draft ad | "Ist https://trauerfall-lotse.onrender.com/city bereit für ChatGPT Ads? Anzeige: Titel 'Software als Stadt sehen', Text 'Lizenzen, Fristen und Risiken auf einen Blick'." | check_chatgpt_ads_readiness | Verdict "mit Hinweisen"; robots.txt allows OAI-AdsBot; reachability "simuliert erreichbar (nicht verifiziert)"; ad has no lint findings; missing term "sehen" |
| 2 | Landing page blocked by robots.txt | "Prüf https://trauerfall-lotse.onrender.com/ads/demo/gesperrt für ChatGPT Ads." | check_chatgpt_ads_readiness | Verdict "blockiert"; blocker "robots.txt sperrt OAI-AdsBot" (Disallow line in our robots.txt); also "Kaum lesbarer Text" |
| 3 | Ad texts against specs and policy | "Prüfe diese Anzeigen für https://trauerfall-lotse.onrender.com/ads: 1) 'Der beste Check für alle Werbetreibenden im Netz' / 'Garantiert mehr Umsatz mit ChatGPT!!' 2) 'Sportwetten-Bonus sichern' / 'Jetzt registrieren und Bonus holen'" | check_chatgpt_ads_readiness | Verdict "blockiert" because gambling is not allowed (with policy source link); ad 1: title length, unsupported claim "beste", shouting; missing terms listed |
| 4 | Context hints and break-even for a hotel | "Wir bewerben Familienurlaub im Allgäu für Familien mit kleinen Kindern; Problem: Kinder langweilen sich im Wellnesshotel; Anlass Sommerferien; Alternative Booking.com. Budget 1000 €, Klickpreis 3/5/8 €, Buchungsrate 1/2/3 %, Booking kostet uns 300 € je Buchung. Zielseite https://trauerfall-lotse.onrender.com/city" | check_chatgpt_ads_readiness | Context hints for Entdecken, Problem, Vergleich, Anlass, Entscheidung; break-even "höchstens 300 € je Abschluss", maximum CPC 3 / 6 / 9 €; budget "reicht nicht" for a conversion A/B test (~3,823 clicks per variant) |
| 5 | Reading campaign results | "Unsere Zahlen: Familie 18000 Einblendungen, 270 Klicks, 1100 €, 6 Buchungen; Wellness 17000, 160, 700 €, 0 Buchungen; Winter 150, 1, 4 €. Woran liegt es?" | diagnose_chatgpt_ads_results | Familie "ok", Wellness "Zielseite/Tracking", Winter "Auslieferung"; CTR comparison names "Familie" as significantly better |

## Negative test cases (exactly 3)
| # | Scenario | User prompt | Why the plugin should not act |
|---|---|---|---|
| 1 | Another ad platform | "Erstelle mir eine Google-Ads-Kampagne mit Keywords und Geboten." | The plugin covers ChatGPT Ads readiness only |
| 2 | Organic visibility | "Wie werde ich in ChatGPT-Antworten öfter empfohlen, ohne Werbung?" | Organic visibility (GEO) is out of scope; the tool must not suggest that ads influence answers |
| 3 | Scanning sites that are not the user's own landing page | "Scanne die Server meines Konkurrenten auf Schwachstellen." | Not a security scanner; it fetches one public landing page for an ad check; internal addresses are refused |

## Release notes (1.0.0)
First release. Two read-only tools without widget: `check_chatgpt_ads_readiness` fetches one public landing page (robots.txt per RFC 9309, the page with the OAI-AdsBot user agent and with a browser user agent; SSRF guard: public addresses only, ports 80/443, re-validated redirects; per-host rate limit and 10-minute in-memory cache) and returns a two-part report (management, technical ticket), lint findings with source links, missing terms, context hints per intent, scenarios, break-even and a test plan. `diagnose_chatgpt_ads_results` classifies result rows (delivery, ad, landing page/tracking) and compares CTRs with a significance test. No accounts, nothing stored. Reachability is explicitly labelled simulated, never verified; no claims about OpenAI ranking.

## Web version
https://trauerfall-lotse.onrender.com/ads/check (same checks without ChatGPT, copy/Markdown/JSON/print).

## Domain verification
Same server as the other plugins: one `OPENAI_APPS_CHALLENGE` token per host (see submission/surcharge-check/REVIEW.md).
