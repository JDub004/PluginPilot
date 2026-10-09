# ChatGPT Ads: Analyse und "Ads-Readiness"-Werkzeug (Stand 09.10.2026)

> **Quellenlage:** Die OpenAI-Hilfeseiten (help.openai.com, ads.openai.com) blockieren automatische Abrufe (HTTP 403).
> Die Fakten unten stammen aus Suchergebnissen zu genau diesen offiziellen Seiten und aus openai.com. Wortlaut vor
> Kampagnenstart im Ads Manager bzw. im Browser prüfen. Dritt-Quellen (Agenturblogs) sind als solche markiert.
> **Kein Zugriff** auf Ranking-Gewichte, Auktionsdaten, Wettbewerber-Gebote oder Nutzer-Chats. Daher keine
> Behauptung über "den Algorithmus".

## 1. Evidenzkarte: Bekannt / Beobachtet / Hypothese / Unbekannt

| Faktor | Status | Aussage | Quelle |
|---|---|---|---|
| Kontext des aktuellen Chats | **Bekannt** | Ads werden nach Kontext und Absicht des aktuellen Gesprächs ausgewählt; auch ohne Personalisierung | [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt), [Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics) |
| Titel, Text, Landingpage, Kontext-Hinweise | **Bekannt** | werden als Signale berücksichtigt (Gewichtung unbekannt) | [Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics) |
| Kontext-Hinweise (Ad-Group) | **Bekannt** | breite thematische Signale, **keine** Exact-Match-Keywords, keine Garantie; beschreibende Sätze statt Stichworte empfohlen | [Ad Groups](https://help.openai.com/en/articles/20001211-create-ad-groups-for-chatgpt-ads) |
| Personalisierung | **Bekannt** | optional: frühere Chats, Memory, Ad-Interaktionen; in EWR/Schweiz anfangs nicht verfügbar | [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt) |
| Sensible Themen | **Bekannt** | keine Ads bei Gesundheit, Psyche, Politik; keine Ads für unter 18-Jährige | [Ad policies](https://openai.com/policies/ad-policies/) |
| Antworten unabhängig | **Bekannt** | Werbung beeinflusst die Antworten nicht; Werbetreibende sehen keine Chats, nur aggregierte Zahlen | [Testing ads](https://openai.com/index/testing-ads-in-chatgpt/) |
| Längen | **Bekannt** | Titel 16–24 Zeichen empfohlen, max. 50; Text 32–48 empfohlen, max. 100; Bild quadratisch, max. 1200×1200 | [Bulk-Upload-Checkliste](https://help.openai.com/en/articles/20001218-bulk-upload-campaign-schema-checklist) |
| Landingpage | **Bekannt** | muss für **OAI-AdsBot** erreichbar sein (robots.txt, WAF, CAPTCHA, Login, App-only blockieren die Prüfung); passendste Unterseite statt Startseite; Anzeige und Seite müssen dasselbe Angebot beschreiben | [Crawler-Guidance](https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers), [Ad policies](https://openai.com/policies/ad-policies/) |
| Kategorien | **Bekannt** | Fokus Konsumenten-Verticals; Finanzen/Gesundheit/Recht nur für freigegebene Werbetreibende; Glücksspiel, Dating, Alkohol/Drogen, Politik, Jobs/Wohnungen nicht erlaubt | [Ad policies](https://openai.com/policies/ad-policies/) |
| Verfügbarkeit Europa | **Bekannt** | 31 europäische Märkte inkl. Deutschland ab Ende Aug. 2026; Free- und Go-Nutzer; Self-Serve-Ads-Manager ab ca. 31.08. | [OpenAI: Expands across Europe](https://openai.com/index/chatgpt-ads-expands-across-europe/), [Digiday](https://digiday.com/marketing/openais-ads-business-hits-europe-at-the-six-month-mark/) |
| Gebotsmodell | **Beobachtet (Dritte)** | CPM im Pilot, seit Self-Serve auch CPC; Pixel + Conversions API | [Flyweel](https://www.flyweel.co/blog/openai-launches-chatgpt-ads), [cloro](https://cloro.dev/blog/how-to-advertise-on-chatgpt/) |
| Preise | **Beobachtet (Dritte, unbestätigt)** | CPM ca. 25–60 $, CPC ca. 2–8 $, B2B-Software höher | [topgrowthmarketing](https://topgrowthmarketing.com/how-much-do-chatgpt-ads-cost/), [jollygoodweb](https://www.jollygoodweb.com/resources/chatgpt-ads-what-advertisers-need-to-know-in-2026) |
| Reporting | **Beobachtet (Dritte)** | Impressionen, Klicks, Kosten, CTR, CPC, CPM pro Tag; keine Placement- oder Demografie-Daten | [jollygoodweb](https://www.jollygoodweb.com/resources/chatgpt-ads-what-advertisers-need-to-know-in-2026) |
| Mehr Begriffe = mehr Auslieferung | **Hypothese, eher falsch** | Keyword-Wiederholung widerspricht der offiziellen Empfehlung (beschreibende Hinweise); nur per Test prüfen | – |
| Konsistenz Anzeige ↔ Seite verbessert Freigabe und CVR | **Hypothese (plausibel)** | offiziell als Policy-Anforderung; Wirkung auf Auslieferung unbekannt | – |
| Gewichte, Qualitätsfaktor, Auktionsformel | **Unbekannt** | nicht veröffentlicht | – |
| Konversionsraten, ROAS | **Unbekannt** | keine öffentlichen Werbetreibenden-Daten gefunden | – |

## 2. Wording: belegt vs. hypothetisch
- **Belegt (offiziell empfohlen):** klarer Nutzen im Titel; jede Variante mit eigenem Blickwinkel; beschreibende Kontext-Hinweise (Situation + Bedürfnis + Zielgruppe); Seite und Anzeige beschreiben dasselbe.
- **Hypothesen zum Testen:** konkrete Zahl/Ergebnis im Text („Fristen 90 Tage vorher“) schlägt allgemeinen Nutzen; Problem-Titel schlägt Kategorie-Titel in Vergleichs-Gesprächen; deutsche Fachbegriffe („Kündigungsfrist“) matchen deutsche Chats besser als englische („SaaS renewal“).
- **Vermeiden:** Superlative ohne Beleg, Keyword-Stapel, Versprechen, die die Seite nicht einlöst.

## 3. Absichts-Cluster und Kontext-Hinweise (Beispiel: Software-Stadt)
| Absicht | Gesprächssituation (als Kontext-Hinweis formuliert) |
|---|---|
| Entdecken | „Geschäftsführer eines Mittelständlers will wissen, welche Software die Firma nutzt und was sie kostet“ |
| Problem | „Firma zahlt für Software-Lizenzen, die niemand nutzt, und sucht Einsparungen“ |
| Frist | „Büroleitung verpasst Kündigungsfristen von Software-Abos und will rechtzeitig erinnert werden“ |
| Risiko | „IT-Leitung will wissen, welche kritischen Programme an einer einzigen Person hängen“ |
| Vergleich | „Unternehmen sucht Alternative zur Excel-Liste für Software-Inventar und Lizenzen“ |
| Umsetzung | „IT-Dienstleister bereitet Jahresgespräch mit Kunden vor und braucht eine verständliche Software-Übersicht“ |

## 4. Wettbewerb
Nicht systematisch erhebbar: Es gibt keine öffentliche Anzeigen-Bibliothek für ChatGPT Ads, und Anzeigen gezielt über Fake-Konten zu provozieren ist ausgeschlossen. Sinnvoll und legal: Landingpages direkter Alternativen (Docusnap, Augmentt, Zylo, Excel-Vorlagen) auf Positionierung lesen. Das steht bereits in `docs/sim/ERGEBNIS_SIMULATION.md`.

## 5. Varianten (geprüft mit `src/domain/adsready/check.ts` gegen die aktualisierte Seite /city)
| # | Blickwinkel | Titel | Text | Prüfung | Konsistenz mit Seite |
|---|---|---|---|---|---|
| A | Kategorie | Software als Stadt sehen | Lizenzen, Fristen und Risiken auf einen Blick | ok | 88 % |
| E | Vergleich | Excel-Liste war gestern | Software, Fristen und Risiken als Tabelle | ok | 86 % |
| B | Problem | Software-Kosten senken | Ungenutzte Lizenzen und doppelte Tools finden | ok | 75 % |
| C | Frist | Kündigungsfristen im Blick | Vorlage fürs Kündigungsschreiben inklusive | Titel 26 Zeichen (empfohlen ≤ 24) | 67 % |
| D | Nutzen | Lizenz-Chaos aufräumen | Doppelte Tools finden, Kosten senken | ok | 50 %: Seite nutzt „Lizenz-Chaos“ nicht |

Konsistenz ist **unsere Heuristik** (Anteil der Anzeigenbegriffe, die auf der Seite vorkommen), kein OpenAI-Wert.

## 6. Szenario-Rechnung (transparent, keine Benchmarks erfunden)
Annahmen, alle unsicher: Budget 1.000 €, CPC 3 / 5 / 8 € (aus Dritt-Quellen, unbestätigt), Konversion = Demo-Anfrage 1 / 3 / 6 %, Wert einer Anfrage 1.200 € (ein Partner-Jahr zu ca. 100 €/Monat).

| Szenario | CPC | Klicks | Konversion | Anfragen | Kosten je Anfrage | ROAS |
|---|---|---|---|---|---|---|
| vorsichtig | 8 € | 125 | 1 % | 1,3 | 769 € | 1,6 |
| Basis | 5 € | 200 | 3 % | 6 | 167 € | 7,2 |
| optimistisch | 3 € | 333 | 6 % | 20 | 50 € | 24 |

Lesart: Die Spanne ist riesig, weil CPC und Konversion unbekannt sind. Ein kleiner Test (Abschnitt 7) ist billiger als jede weitere Schätzung. Keine Monte-Carlo-Simulation, weil es keine belastbaren Verteilungen gibt.

## 7. Testplan
1. **Vorab (kostenlos):** Landingpage-Check (OAI-AdsBot, robots.txt, deutsche Sprache, Seite deckt alle Anzeigen-Begriffe ab), Policy-Check, eine Unterseite je Absicht.
2. **Test 1, Blickwinkel (eine Variable):** 3 Ad-Groups (Problem / Frist / Vergleich) mit gleichem Budget, gleicher Seite, je 2 Titel. 2–3 Wochen.
3. **Mindestmenge:** Für einen CTR-Unterschied von 1,0 % zu 1,5 % (95 % Konfidenz, 80 % Power) braucht es grob 7.700 Impressionen je Variante. Für 3 % gegen 4,5 % Konversion rund 2.500 Klicks je Variante (bei 5 € CPC ca. 12.500 € je Variante); realistisch zuerst nur Auslieferung und Klickrate testen. **Vorher keinen Sieger ausrufen.**
4. **Diagnose trennen:** wenig Impressionen = Auslieferung bzw. Kontext-Hinweise; viele Impressionen und wenig Klicks = Text; viele Klicks und wenig Anfragen = Landingpage.
5. Gewinner behalten, Verlierer dokumentieren (`docs/ads/experiments.md`).

## 8. Landingpage (umgesetzt am 09.10.2026)
- `/robots.txt` fehlte (der Server antwortete mit `{"error":"not found"}`). Jetzt erlaubt die Datei OAI-AdsBot und OAI-SearchBot ausdrücklich.
- `/city` war als `lang="en"` markiert, jetzt `de`.
- `/city` erwähnte Fristen, Vorlagen, Tabellenansicht und Standorte nicht, also Begriffe, mit denen geworben würde. Jetzt ergänzt.
- Offen: je Absicht eine eigene Unterseite (z. B. `/city/fristen`), ein Bild 1200×1200 für die Anzeige, Mess-Pixel nur mit Einwilligung (DSGVO).

## 9. Werkzeug und Befehle
- `src/domain/adsready/check.ts`, Tests `tests/unit/adsready.test.ts`:
  - `lintAd`: Längen, Superlative, Policy-Bereiche, URL, Kontext-Hinweise
  - `consistency`: Anzeige ↔ Seite
  - `robotsAllows`: robots.txt-Prüfung für OAI-AdsBot
  - `scenarios`: Szenario-Rechnung
- Keine neuen Plugins oder Pakete installiert, keine Kosten, keine Kampagne gestartet.
- **Mögliches Plugin „Ads-Readiness“** für ChatGPT: URL und Angebot rein → Landingpage-Check, Varianten-Linter, Kontext-Hinweise je Absicht, Testplan. Vorher Nachfrage prüfen (Agenturen und Shops, die gerade ChatGPT Ads starten).

## 10. Was fehlt für echte Optimierung
- Ads-Manager-Zugang (Self-Serve in DE seit ca. 31.08.2026), Budget und deine Freigabe vor jedem Kampagnenstart.
- Echte Kampagnendaten (Impressionen, Klicks, Conversions). Erst damit lassen sich Hypothesen bestätigen.
- Automatisierung: **nicht aktiv**. Es gibt (soweit öffentlich bekannt) keine dokumentierte Reporting-API, die ich nutzen könnte.
