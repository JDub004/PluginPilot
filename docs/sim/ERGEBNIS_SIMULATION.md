# Software-Stadt: Ergebnis der Systemhaus-Simulation (06.10.2026)

> **Wichtig:** Das sind KI-simulierte Gespräche, keine echten Kunden. Sie zeigen, welche Einwände wahrscheinlich kommen,
> und machen die echten Gespräche besser. Sie beweisen aber keine Nachfrage. Entscheidungen erst nach echten Gesprächen (Teil 5).
> Grundlage: `PRODUCT_BRIEF.md`. 5 Personas, jede mit kurzer Web-Recherche zu Konkurrenz und Preisen.

## 1. Überblick

| Persona | Typ | Kauf heute | Kauf mit Must-haves | Zahlungsbereitschaft | Nächster Schritt |
|---|---|---|---|---|---|
| Thomas Huber | kleines Systemhaus, 6 MA, Niederbayern | ~20 % | – | 30–50 €/Monat oder 20–30 € pro Check; 299 € ausgeschlossen | Solo-Pilot mit eigener Excel bei 1 Kunden, Telefonat in 4 Wochen |
| Sandra Kowalski | MSP, 38 MA, 120 Kunden, Düsseldorf | ~15 % | ~55 % | 99 € sofort, 199–299 € pauschal mit Import und Logo | Pilot: 3 Kunden, 1 Quartal |
| Dr. Henrik Lammers | Microsoft-CSP, 85 MA, Hamburg | ~25 % (Pilot) | – | 199–299 € Pilot; 500–800 € mit White Label und SSO; OEM/Revenue Share | 3 Workshops durch die Licensing-Leiterin, nur Web |
| Aylin Demir | Security/NIS2-Beratung, 22 MA, Stuttgart | ~25 % | ~55 % | 79–99 € als Vertriebswerkzeug; bis 249 €, wenn es Erhebungszeit spart | 4-Wochen-Pilot in einem echten NIS2-Kick-off |
| Markus Brandt | Endkunde, Handwerk, 64 MA | – | – | 20–30 €/Monat **nur über die Rechnung des Systemhauses** | handelt bei 3 Funden innerhalb von 30 Tagen |

**Kurzfazit:** Alle sagen ja zu einem kostenlosen Pilot, aber noch niemand zum Bezahlen. Die Stadt öffnet Gespräche zuverlässig.
Gekauft wird erst, wenn die Daten ohne Abtippen hineinkommen und die Datenschutzfragen beantwortet sind.

## 2. Was in allen 5 Gesprächen gleich war

**Stärken (immer der beste Moment):**
1. **Kündigungsfrist mit fertigem Schreiben.** Huber hatte genau diesen Fall: 2.000 € verloren.
2. **"Schlüsselperson ohne Vertretung".** Ein Sicherheitsgespräch, ohne "Security" sagen zu müssen. Drei Personas haben es von sich aus hervorgehoben.
3. **Schatten-IT außerhalb von Microsoft:** Kreditkarten-Abos und Fremdtools. Lighthouse und Distributor-Portal zeigen das **nicht**.
4. **"Rot = Geld"** versteht ein Geschäftsführer in unter 2 Minuten.

**Schwächen (immer der schwächste Moment):**
1. **Kein automatischer Import.** "Wenn meine Techniker das abtippen, ist es tot." Ziel: unter 30 Minuten pro Kunde.
2. **Datenschutz:** Kontaktdaten im weiterleitbaren Link, ChatGPT als Kanal, Ein-Personen-Anbieter ohne AVV und Exit-Zusage.
   → Kontaktdaten im Link sind seit heute **behoben**.
3. **Spielzeug-Optik vor Auditoren oder C-Level.** Gefordert ist eine nüchterne Tabellen- bzw. Berichtsansicht als Umschalter.
4. **Interessenkonflikt beim Thema "ungenutzte M365-Lizenzen".** Systemhäuser verdienen an diesen Lizenzen.
5. **Health-Score "49" versteht niemand.** Stattdessen: "x € zu viel, y Fristen, z Risiken".

**Kein Interesse an:** herumlaufenden Personen, Netzwerkkarte und Stadt pro Standort (Brandt). Für die Demo sind sie nett, für die Kaufentscheidung irrelevant.

## 3. Was das für das Produkt heißt (Reihenfolge)

| # | Baustein | Warum | Aufwand |
|---|---|---|---|
| 1 | **Nüchterne Ansicht** (Tabelle mit Ampel, statt Stadt) + Bericht in € statt Score | 4 von 5 wollen sie | klein |
| 2 | **Partner-Logo und -Name** auf Bericht und Stadt | blockiert die Piloten (Kowalski, Huber) | klein, ohne Speicherung |
| 3 | **Excel rein, Excel raus (Round-Trip)** inkl. Fristen und Kontakten | "Petras Liste bleibt die Quelle" | klein (Export gibt es schon, Import ausbauen) |
| 4 | **Sicherheits-Einseiter:** AVV-Entwurf, TOMs, Unterauftragnehmer, Hosting, Exit-Zusage | erster Einwand bei allen | Dokument, kein Code |
| 5 | Optionale **Compliance-Felder:** Vertraulichkeit/Integrität/Verfügbarkeit, RTO/RPO, Lieferant mit AVV/Zertifikat; Export für verinice und i-doit | Security-Berater | mittel |
| 6 | **Gespeicherte Mandanten + E-Mail-Erinnerung an Fristen** (Web-App, EU-Hosting) | das eigentliche Abo | groß, **erst nach echter Validierung** |
| 7 | **M365-Import** über Graph/GDAP für mehrere Mandanten | Eintrittskarte bei MSPs und CSPs | groß, erst nach zahlenden Piloten |

Die Bausteine 1–4 sind sofort sinnvoll und brauchen weder Datenbank noch Konten.

## 4. Positionierung, Preis, Pitch

- **Zielgruppe zuerst:** MSPs und Security-Berater mit Mittelstandskunden (30–250 MA). Kleine Systemhäuser nur mit Einsteigerpreis. Endkunden **nicht direkt**, sondern über das Systemhaus.
- **Kanal:** Web-App für Partner. ChatGPT bleibt das kostenlose Nebenprojekt bzw. Schaufenster und wird vor Endkunden nicht gezeigt.
- **Preisliste (fest, schriftlich, keine Spanne):**
  - **Starter:** 39 €/Monat, bis 10 Kunden-Städte
  - **Partner:** 149 €/Monat, bis 50 Städte, eigenes Logo
  - **Pro:** 349 €/Monat, unbegrenzt, Compliance-Export, später M365-Import
  - Pilot: 1 Quartal kostenlos mit festen Erfolgskriterien
  - Pauschal statt pro Seat, weil Seat-Preise die Marge des Systemhauses fressen. Endkunde zahlt über die Rechnung des Systemhauses, ca. 20–30 €.
- **Pitch** (nicht "Software-Inventar", nicht "Sparen"):
  - **MSP:** *"Das Jahresgespräch, das Ihr Kunde nicht vergisst, und das ein Angebot erzeugt."*
  - **Microsoft-Partner:** *"Fremdtools finden, die Microsoft 365 schon abdeckt; Risiken und Fristen sichtbar machen."*
  - **Security:** *"Die Stadt öffnet das Gespräch mit dem Geschäftsführer, der Export füttert Ihr ISMS."*
  - **Klein:** *"Finden Sie die Leichen, bevor Ihr Kunde sie findet."*
- **Nie versprechen:** Sicherheitscheck, Audit-Nachweis, NIS2-Konformität.

## 5. Echte Validierung (die eigentliche Aufgabe)

**Ziel:** 8 echte Erstgespräche in 4 Wochen (3 MSPs, 2 Security-Berater, 2 kleine Systemhäuser, 1 Microsoft-Partner).

**Entscheidungsregeln** (vorher festgelegt, damit man sich nichts schönredet):
- **Weiter Richtung Web-App:** ≥ 3 von 8 sagen einen Pilot mit echtem Kunden zu **und** ≥ 2 nennen ungefragt einen Preis ≥ 99 €/Monat.
- **Umsteuern:** Alle mögen die Optik, aber keiner nimmt einen Pilot. Dann ist das Produkt "nur hübsch". Prüfen, ob "Fristen-Gedächtnis + Vorlagen" ohne Stadt mehr zieht.
- **Stoppen:** < 2 Piloten nach 8 Gesprächen.
- **Pilot erfolgreich**, wenn: Vorbereitung unter 30 Min. pro Kunde, ≥ 1 Angebot oder Projekt aus dem Termin **und** der Partner fragt nach Preis.

**Gesprächsleitfaden (30 Min.):**
1. **Realität (10 Min.):**
   - "Wann hat bei einem Kunden zuletzt Software-Chaos Geld gekostet? Wer hat es gemerkt?"
   - "Wie dokumentieren Sie heute die Anwendungen eines Kunden? Wie aktuell ist das?"
   - "Wie läuft Ihr Jahres- oder Quartalsgespräch? Was davon führt zu Aufträgen?"
   - "Was sehen Sie **nicht** (Kreditkarten-Abos, Fremdtools)?"
2. **Demo (5 Min.):** nur drei Dinge zeigen: Kündigungsfrist mit Schreiben, Schlüsselperson ohne Vertretung, Fremdtool-Doppelung. Dann den Bericht.
3. **Prüfen (10 Min.):**
   - "Bei welchem Kunden würden Sie das nächste Woche einsetzen?"
   - "Was muss da sein, bevor Sie zahlen?"
   - "Was ist Ihnen das pro Monat wert?" (Zahl abwarten, nicht vorgeben)
4. **Abschluss (5 Min.):** konkreter Pilot mit Datum und einem benannten Kunden, oder ehrlich "passt nicht".

**Erstnachricht** (LinkedIn/E-Mail, an Geschäftsführung oder Vertriebsleitung von Systemhäusern):
> Hallo [Name], ich baue ein Werkzeug für Systemhäuser: Aus der Softwareliste eines Kunden entsteht in 30 Minuten eine
> anschauliche Übersicht mit Kündigungsfristen, Schatten-IT und Schlüsselpersonen ohne Vertretung, inklusive fertiger
> Schreiben und Bericht mit Ihrem Logo. Ich verkaufe noch nichts. Ich suche 8 Systemhäuser, die mir in 30 Minuten sagen, ob das in
> ihren Jahresgesprächen hilft oder Spielerei ist. Hätten Sie nächste Woche Zeit? Viele Grüße, [Name]

**Wo finden:** LinkedIn-Suche "Geschäftsführer Systemhaus" bzw. "Managed Services" + Region; IHK-Digitalnetzwerke; Microsoft-Partner-Verzeichnis;
Systemhaus-Verbünde (z. B. Kooperationen und Einkaufsverbünde); eigenes Netzwerk. Für einen glaubwürdigen ersten Eindruck: Sicherheits-Einseiter mitschicken.
