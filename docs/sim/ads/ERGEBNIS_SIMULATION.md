# Ads-Readiness: Ergebnis der Simulation (09.10.2026)

> KI-simulierte Gespräche, keine echten Kunden. Sie zeigen wahrscheinliche Einwände, beweisen aber keine Nachfrage.
> Grundlage: `PRODUCT_BRIEF.md`. 5 Personas, jede mit eigener Web-Recherche.

## 1. Überblick
| Persona | Typ | Kauf | Zahlungsbereitschaft | Bester Moment | Schwächster Moment |
|---|---|---|---|---|---|
| Jana Petersen | Performance-Agentur, 24 MA, 35 Kunden | ~30 % (Abo ~10 %) | 30–50 € pro Check, 20 Checks ~500 €, Flat höchstens 199 €/Monat mit White-Label | Szenario-Tabelle + Testplan als Antwort auf „Sollen wir auf ChatGPT?“ | Konsistenz-Prozent („Keyword-Dichte mit neuem Namen“), „Was macht es nach Woche 1?“ |
| Deniz Arslan | Shopify-Rösterei, 1,8 Mio € | Gratis-Check 90 %, Audit 10 %, Wächter 25 % | 0–79 € einmalig; 19–29 €/Monat nur als Wächter mit Alarmen | Cloudflare blockt den Bot („ich hätte bezahlt und nichts wäre gelaufen“); Hinweis-Sätze = seine Kundenmails | „40 %“ unverständlich; 500-€-Rechnung schreckt ab |
| Lukas Brenner | SEO/GEO-Berater | ~35 % (mit CLI/JSON ~60 %) | 30–60 € pro Report, 20 für ~500 €/Jahr | Hinweis-Sätze ersetzen Workshop; Diagnoseregeln | Bot-Check per Fake-UA als „erreichbar“; Prozent-Score scheitert an Komposita |
| Miriam Schulte | B2B-SaaS (finanznah) | Audit ~25 %, Abo < 10 % | 290–500 € einmalig ohne Procurement | ehrliche Stichprobenrechnung; WAF-Challenge | Score, Hinweise unvalidiert, kein AVV |
| Claudia Hofer | Hotelgruppe, 4 Häuser | Saison-Check ~30 %, Abo < 5 % | 250–400 € pro Saison für alle Häuser | Hinweis-Sätze (dort war sie im Ads Manager ausgestiegen); Wellness-Startseite vs. Familien-Anzeige | breite Szenario-Spanne; Buchungen nicht messbar |

**Kurzfazit:** Alle würden den Gratis-Check sofort nutzen. Niemand will ein Monatsabo zu 49 €. Bezahlt wird **pro Check** bzw. **pro Saison** oder als **Kontingent für Agenturen und Berater**.

## 2. Einig in allen 5 Gesprächen
**Wert:**
1. **Erreichbarkeits-Fund** (WAF/Cloudflare/Buchungsmaschine blockt OAI-AdsBot), mit Anleitung, wie man ihn **ohne Betrugsschutz abzuschalten** freigibt.
2. **Hinweis-Sätze je Absicht.** Genau dort scheitern Nutzer im Ads Manager („Heizung Hamburg Notdienst“ statt Sätzen).
3. **Ehrliche Rechnung + Testplan + Diagnoseregeln** als Antwort auf „Sollen wir auf ChatGPT Ads?“.
4. **Falsche Zielseite** (Startseite statt passender Unterseite) und **fehlende Begriffe als Liste**.

**Ablehnung:**
1. **Konsistenz als Prozentzahl.** Wirkt wie eine OpenAI-Note, scheitert an deutschen Komposita. → **streichen, nur Liste fehlender Begriffe.**
2. **„Erreichbar“ aus einem simulierten Abruf** ist zu stark formuliert. → „simuliert, nicht verifiziert“; echte Prüfung nur über Server-Logs.
3. **Monatsabo ohne neuen Nutzen nach Woche 1.**
4. **Versprechen** („besser ranken“, ROAS).

**Gefordert (Reihenfolge nach Häufigkeit):**
- weiterleitbarer Bericht für zwei Leser: Technik-Ticket + eine Seite für die Geschäftsführung (5/5)
- Policy-Hinweise mit Quelle und Prüfdatum (3/5)
- robots.txt exakt nach RFC 9309 mit Testfällen (Berater)
- Break-even gegen den bestehenden Kanal (Provision bei Booking, ROAS-Ziel, Bestellwert)
- JSON/CSV-Export, White-Label, CLI (Agentur, Berater)
- Diagnose aus dem Ads-Manager-CSV nach dem Start (Agentur)

**Nicht gebraucht:** Score-Zahlen, ausführliche Taxonomie, Shouting-Linter (Ads Manager prüft vieles selbst), Monitoring als eigenes Abo.

## 3. Entscheidung (GO, mit engem Zuschnitt)
**Bauen (jetzt, ohne Konten und ohne Speicherung):**
1. Landingpage-Check: robots.txt nach RFC 9309 (Gruppen zusammenführen, `*`, `$`, Groß/klein, längste Regel, Gleichstand → Allow, 4xx → alles erlaubt, 5xx → unsicher); simulierter Abruf mit klarer Kennzeichnung; Erkennung von Challenge/CAPTCHA/Login/zu wenig Text; Startseite vs. Unterseite; Seitensprache; Freigabe-Anleitung je CDN (Cloudflare, Shopify, allgemein).
2. Anzeigen-Prüfung: Längen, unbelegte Superlative, Policy-Bereiche **mit Quelle und Datum**, **Liste fehlender Begriffe** (mit Kompositum-Erkennung), keine Prozentzahl.
3. Hinweis-Sätze je Absicht aus Zielgruppe, Angebot, Problem und Anlass, plus unterschiedliche Anzeigen-Blickwinkel.
4. Entscheidungsrechnung: Szenarien, **Break-even-Kosten je Abschluss** (Wert × Marge bzw. bestehende Provision), Mindeststichproben, Empfehlung „was mit diesem Budget prüfbar ist“.
5. Diagnose aus Ergebnis-Zahlen (Impressionen, Klicks, Kosten, Conversions je Variante) → Auslieferung / Anzeige / Seite / Tracking und nächster Test.
6. Bericht in zwei Teilen (Technik-Ticket, Geschäftsführung) als Markdown, dazu JSON; CLI für Berater.
7. ChatGPT-Plugin (kostenlos) mit genau diesen Werkzeugen. Das bezahlte Partner-Angebot (Kontingent, White-Label) erst nach echter Validierung.

**Nicht bauen:** Abo-Monitoring, Score-Zahlen, Ranking-Versprechen, Consent-Pixel-Prüfung (das genaue OpenAI-Pixel-Snippet ist uns nicht offiziell bekannt; nicht raten), Log-Upload (erst wenn ein Berater Logs liefert).

**Preise für echte Gespräche (Hypothesen):** Gratis-Check; Berater/Agentur 20 Checks für 490 €/Jahr (≈ 25 €/Check) mit White-Label; Direktkunde einmalig 149 € bzw. Saison-Check 290 € für bis zu 5 Häuser oder Shops.

**Echte Validierung:** 3 Agenturen/Freelancer (Zielkunde laut Deniz und Jana), 2 Berater, 1 Hotel. Regel: ≥ 2 kaufen ein Kontingent innerhalb von 4 Wochen nach dem Pilot → Partner-Version bauen; sonst bleibt es ein Gratis-Werkzeug als Lead-Magnet.
