# Software-Stadt: submission material (copy into the OpenAI plugin portal)

## Listing
| Field | Value |
|---|---|
| Display name (≤30) | Software-Stadt |
| Subtitle (≤30) | Firmen-Software als Stadt |
| Developer name | PluginPilot *(must match your verified developer identity)* |
| Category | Business & Operations |
| Website | https://trauerfall-lotse.onrender.com/city |
| Support | https://trauerfall-lotse.onrender.com/support |
| Privacy policy | https://trauerfall-lotse.onrender.com/privacy |
| Terms of service | https://trauerfall-lotse.onrender.com/terms |
| MCP server URL | https://trauerfall-lotse.onrender.com/city/mcp |
| Authentication | None |

## Test account
Not applicable: no authentication, no accounts.

## Positive test cases (exactly 5)
Expected results produced by running the tool on 2026-10-05.

| # | Scenario | User prompt | Expected tool | Observable expected result |
|---|---|---|---|---|
| 1 | Mid-sized company with typical tool sprawl | "Zeig mir unsere Software als Stadt: [17 programs as in the demo Beispiel GmbH: Microsoft 365, Slack, Teams, SharePoint, Dropbox, HubSpot, Kundenliste.xlsx, Pipedrive, DATEV, Lexoffice, Personio, Mailchimp, Canva, Shopify, Zendesk, Power BI, Bitwarden with departments, users, licences and costs]" | map_software_city | Town with 17 buildings in 7 districts, health 49/100, savings potential 12,360 €/year, 20 quests; the first quest is "Kritische Daten in einer Tabelle: Kundenliste.xlsx" |
| 2 | Small firm with shadow IT and a critical spreadsheet | "Wir sind eine Steuerkanzlei: DATEV (Buchhaltung, 6 Nutzer, kritisch, verantwortlich Kanzleileitung), Outlook für alle (12), WhatsApp für alle (8, nicht freigegeben), Mandantenliste.xlsx im Sekretariat (3, kritisch). Zeig mir das als Stadt." | map_software_city | 4 buildings, quests include critical spreadsheet (Mandantenliste.xlsx), "2 Tools für Kommunikation" and "Schatten-IT: WhatsApp" |
| 3 | Unused licences | "Figma im Design: 4 Nutzer, 10 Lizenzen, 150 € im Monat. Asana für alle: 9 Nutzer, 10 Lizenzen, 110 €. Wo verschwenden wir Geld?" | map_software_city | Quests "6 ungenutzte Lizenzen in Figma" and "1 ungenutzte Lizenz in Asana", savings potential 1,212 €/year |
| 4 | Clean, connected landscape | "Shopware (Vertrieb, kritisch) schickt Daten an JTL-Wawi (Lager), JTL-Wawi an Lexware (Buchhaltung). Alle haben Verantwortliche. Bau die Stadt." | map_software_city | 3 buildings connected by 2 data-flow paths, health 100, no quests |
| 5 | Follow-up after the first map | "Wir haben Slack gekündigt und nutzen nur noch Teams. Bau die Stadt neu." (after case 1) | map_software_city | Town without Slack; the quest "2 Tools für Kommunikation" is gone |

## Negative test cases (exactly 3)
| # | Scenario | User prompt | Why the plugin should not act |
|---|---|---|---|
| 1 | Source code architecture | "Visualisiere die Architektur meines GitHub-Repositories." | Software-Stadt maps business software usage, not source code |
| 2 | Org chart | "Erstelle ein Organigramm unserer Abteilungen mit allen Mitarbeitern." | People and reporting lines are out of scope |
| 3 | Buying advice | "Welches CRM soll ich kaufen?" | General product advice; ChatGPT answers without building a map |

## Release notes (1.0.0)
First release. One read-only tool, `map_software_city`, with an MCP Apps widget (isometric town, plumb-bob status gems, needs bars, quests, pan/zoom, light/dark, reduced motion). Deterministic quest rules: overlapping tools, unused licences with savings, critical spreadsheets, no owner, shadow IT, data islands, unknown data targets.

## Demo video
`assets/demo.webm` → upload as unlisted video and paste the link.

## Domain verification
Same server as Surcharge Check: one `OPENAI_APPS_CHALLENGE` token per host (see submission/surcharge-check/REVIEW.md).
