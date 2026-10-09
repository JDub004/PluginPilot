# ChatGPT-Ads-Check: Skalierung und Vertrieb (Stand 09.10.2026)

## 1. Ehrliche Einschätzung: Lässt sich das skalieren?
**Ja, als Werkzeug mit vielen Nutzern und als Zubringer. Nein, als eigenständiges Abo-Geschäft, jedenfalls nicht im jetzigen Zuschnitt.**

| Spricht dafür | Spricht dagegen |
|---|---|
| Neuer Markt: ChatGPT Ads seit Ende Aug. 2026 in 31 europäischen Ländern, Self-Serve seit ca. 31.08. Jede Firma, die startet, stellt dieselben Fragen. | **Einmal-Bedarf:** Check vor dem Start, danach selten (alle 5 Personas). |
| Konkreter Schaden, den man zeigen kann (Bot-Sperre = Budget läuft ins Leere). | **OpenAI kann es selbst einbauen:** Ads Manager meldet Ablehnungen und wird Prüfungen ergänzen. Unser Vorsprung ist Zeit plus Ehrlichkeit, kein Burggraben. |
| Kosten pro Check nahezu null (deterministisch, kein KI-Modell, ein Seitenabruf). | Geringe Zahlungsbereitschaft bei Shops; Agenturen zahlen pro Check (25–50 €). |
| Agenturen und Berater multiplizieren: ein Kunde = viele Checks. | Konkurrenz durch Agentur-Checklisten, Screaming Frog, curl. |

**Daraus folgt die Strategie:** Kostenlos und viral (Web-Check und Plugin) → Agenturen und Berater als zahlende Kunden (Kontingent mit eigenem Logo) → später erweitern zum **„KI-Sichtbarkeits-Check“** (organisch + Werbung), wenn die Nachfrage es zeigt. Skalierung entsteht über Reichweite und Partner, nicht über Abo-Einnahmen pro Shop.

## 2. Was jetzt vorbereitet ist
| Baustein | Stand |
|---|---|
| ChatGPT-Plugin `/ads/mcp` (2 Werkzeuge) | fertig, getestet |
| Web-Version `/ads/check` ohne ChatGPT (Kopieren, Markdown, JSON, Drucken/PDF) | fertig, getestet |
| Kommandozeile für Berater `scripts/adsready.ts` (`--json`, Exit-Code 1 bei Blockern) | fertig |
| Produktseite `/ads`, Datenschutz ergänzt, robots.txt erlaubt OAI-AdsBot | fertig |
| Schutz vor Missbrauch und Überlast: 6 Checks/Minute je Zieldomain, 4 gleichzeitige Abrufe, 10-Min-Cache, nur öffentliche Adressen | fertig, getestet |
| Einreichungspaket `submission/chatgpt-ads-check-1.0.0.zip` + `REVIEW.md` (5 + 3 Prüffälle, Demo-Seite `/ads/demo/gesperrt`) | fertig |
| Bezahlte Partner-Version (Kontingente, Logo, Arbeitsbereiche je Kunde) | **bewusst nicht gebaut**: erst nach echter Nachfrage |

## 3. Skalierungs-Grenzen der Technik (und was dann zu tun ist)
| Ab ca. | Engpass | Maßnahme |
|---|---|---|
| ~1.000 Checks/Tag | Render-Free-Tier schläft ein (Kaltstart ~30 s) | Bezahlte Instanz (~7 $/Monat) |
| mehrere Instanzen | Limits und Cache liegen im Arbeitsspeicher je Instanz | Gemeinsamer Speicher (z. B. Redis) für Limits und Cache |
| Missbrauch (viele Domains) | Unser Server ruft fremde Seiten ab | Zusätzlich Limit je Aufrufer (IP für Web-Version), Sperrliste, Protokoll ohne Inhalte |
| Agentur-Version | Konten, Abrechnung, Speicherung | AVV, EU-Hosting, Löschfristen (`docs/legal/`) vorher fertig machen |

## 4. Preise (Hypothesen für echte Gespräche)
| Angebot | Preis | Für wen |
|---|---|---|
| Web-Check und ChatGPT-Plugin | kostenlos | alle (Zubringer) |
| Partner-Kontingent | 20 Checks für 490 €/Jahr (≈ 25 €/Check), eigenes Logo, JSON | Agenturen, Freelancer, Berater |
| Agentur-Flat | 149 €/Monat, unbegrenzt, Logo, Arbeitsbereiche | Agenturen ab ~20 Kunden |
| Einmal-Prüfung mit persönlicher Auswertung | 149 € bzw. Saison-Check 290 € für bis zu 5 Häuser/Shops | Direktkunden (Hotels, B2B) |

## 5. Vertrieb: die ersten 30 Tage
1. **Inhalte, die sich teilen lassen:** LinkedIn-Beitrag „Wir haben X Shops geprüft: so viele blockieren den ChatGPT-Werbe-Crawler, ohne es zu wissen.“ Dafür nur **eigene, öffentliche Stichprobe** mit Erlaubnis bzw. anonymisiert; keine Firmennamen an den Pranger.
2. **Agenturen und Freelancer direkt ansprechen** (Zielkunde laut Simulation): 15 Nachrichten pro Woche, Angebot „5 kostenlose Checks für eure Kunden, dafür 20 Minuten Feedback“.
3. **Communities:** Shopify-Partner-Gruppen, OMR/Online-Marketing-Foren, Hotel-Marketing-Netzwerke (Saison-Planung Januar/Juli).
4. **ChatGPT-Plugin** einreichen (Paket fertig) und als zusätzlichen Kanal behandeln, nicht als einzigen.

**Erstnachricht (Agentur):**
> Hallo [Name], viele Kunden fragen gerade „Sollen wir auf ChatGPT Ads?“. Ich habe einen kostenlosen Check gebaut, der vorher zeigt, ob OpenAIs Prüf-Crawler die Landingpage überhaupt erreicht (Cloudflare & Co. blockieren ihn oft), ob Anzeigen und Seite zusammenpassen und was ein Testbudget beweisen kann. Mit fertigem Bericht für den Kunden. Darf ich euch 5 Checks für eure Kunden schenken und danach 20 Minuten Feedback bekommen? [Link /ads/check]

## 6. Kennzahlen und Entscheidungsregeln
- **Aktivierung:** Anteil Checks mit mindestens einem Fund (Blocker oder Hinweis). Ziel > 50 %, sonst ist der Check zu oberflächlich.
- **Wert:** Anteil Blocker-Funde (Bot-Sperre, robots, Login). Das ist der Haupt-Verkaufsgrund.
- **Wiederkehr:** Domains mit zweitem Check innerhalb von 30 Tagen.
- **Zahlungssignal:** **≥ 2 von 6 Agenturen/Beratern kaufen nach dem Pilot ein Kontingent → Partner-Version bauen.** Sonst bleibt es ein kostenloses Werkzeug, das Nutzer zu den anderen Produkten bringt.
- Messung nur über bestehende Ereignisse (Werkzeug, Dauer, Ergebnis), **keine Inhalte und keine URLs protokollieren**.

## 7. Risiken
- **OpenAI ändert Crawler, Richtlinien oder baut Prüfungen ein** → Regeln mit Prüfdatum, monatlich gegen die offizielle Doku prüfen; Wert verlagern auf Bericht, Entscheidung und Diagnose.
- **Rechtlich:** Wir rufen fremde Seiten ab (eine Anfrage pro Check, robots.txt wird gelesen) und behaupten nichts über Dritte öffentlich. Keine Rechtsberatung zu Einwilligung und Pixel.
- **Reputation:** Nie „besser ranken“ versprechen. Die Ehrlichkeit war in allen Simulationen der stärkste Verkaufspunkt.
