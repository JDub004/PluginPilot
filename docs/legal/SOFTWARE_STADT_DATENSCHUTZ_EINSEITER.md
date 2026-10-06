# Software-Stadt: Datenschutz und Sicherheit auf einer Seite

> **ENTWURF, rechtlich nicht geprüft.** Vor dem ersten Versand von einer Datenschutzberatung oder Anwaltskanzlei prüfen lassen.
> Platzhalter in [eckigen Klammern] ausfüllen. Stand: 06.10.2026, beschreibt den **heutigen** technischen Stand.

**Anbieter:** [Firmenname, Anschrift, Vertretungsberechtigte Person, E-Mail]
**Ansprechpartner Datenschutz:** [Name/E-Mail]

## 1. Welche Daten verarbeitet werden
| Daten | Pflicht? | Beispiel |
|---|---|---|
| Programmliste: Name, Kategorie, Abteilung, Nutzer- und Lizenzzahl, Kosten, Vertragsende | ja | "DATEV, Buchhaltung, 3 Nutzer, 280 €/Monat" |
| Verantwortliche als **Rolle** | empfohlen | "IT-Leitung" statt eines Namens |
| Ansprechpartner mit Name, geschäftlicher E-Mail und Telefon | **optional** | nur mit Zustimmung der Person |
| Standorte und externe Partner (Firmenname, Ort) | optional | "Spedition, Bremen" |

**Nie eingeben:** Passwörter, Kundendaten, Patienten- oder Gesundheitsdaten, private Kontaktdaten, Bankumsätze von Personen.

## 2. Wo die Daten liegen (heute)
- **Keine Speicherung.** Der Server berechnet die Stadt und vergisst die Eingabe sofort. Es gibt keine Datenbank und keine Konten.
- **Server:** [Render Services Inc.], Rechenzentrum **Frankfurt am Main (EU)**.
  Unterauftragsverarbeiter, siehe Abschnitt 5.
- **Protokolle:** nur technische Ereignisse (Werkzeugname, Dauer, Anzahl Funde). **Keine Inhalte, keine Namen, keine Beträge.**
- **Teilen-Link:** Die Programmliste steht kodiert (nicht verschlüsselt) im Link-Teil nach `#`. Beim Öffnen schickt die Seite die Liste einmal zur Berechnung an den Server; dort wird sie nicht gespeichert und nicht protokolliert.
  **Kontaktdaten (E-Mail, Telefon, Notizen) werden nie in Links übernommen.** Wer den Link hat, sieht die Programmliste. Deshalb nur gezielt teilen.
- **Ausgaben** wie Bericht, Software-Verzeichnis, Notfall-Kontakte und Vorlagen entstehen im Browser und werden kopiert oder heruntergeladen. Sie liegen danach bei Ihnen.

## 3. Nutzung über ChatGPT (optional)
Die ChatGPT-App ist ein **zusätzlicher** Zugang. Was dort eingegeben wird, verarbeitet OpenAI nach seinen eigenen Bedingungen und
gegebenenfalls außerhalb der EU. **Für Kundendaten empfehlen wir die Web-Version ohne ChatGPT.** Die Auswertung selbst ist regelbasiert;
dabei wird kein KI-Modell mit Ihren Daten aufgerufen.

## 4. Technische und organisatorische Maßnahmen (Kurzfassung)
- Verschlüsselte Übertragung (HTTPS/TLS), keine Speicherung von Eingaben, keine Weitergabe an Dritte.
- Strenge Eingabeprüfung (Validierung jedes Feldes), Größenbegrenzung von Anfragen, Sicherheits-Header (CSP, kein Referrer).
- Quellcode versioniert, automatisierte Tests vor jeder Veröffentlichung.
- Zugriff auf die Server-Konfiguration nur durch [Name], mit Zwei-Faktor-Anmeldung.
- **Noch nicht vorhanden:** ISO-27001-Zertifikat, externer Penetrationstest, Single Sign-on. Geplant ab [Datum/Bedingung].

## 5. Unterauftragsverarbeiter
| Dienst | Zweck | Ort |
|---|---|---|
| [Render Services Inc.] | Server-Betrieb | Frankfurt am Main (EU); Unternehmen mit Sitz in den USA, [Standardvertragsklauseln prüfen] |
| OpenAI (nur bei Nutzung der ChatGPT-App) | Chat-Oberfläche | [laut OpenAI-Bedingungen] |

## 6. Zusagen für Partner (Exit und Fortbestand)
- **Datenexport jederzeit:** Software-Verzeichnis als Excel/CSV. Es lässt sich wieder einlesen, es gibt also keinen Lock-in.
- **Löschung:** Heute wird nichts gespeichert. Für eine spätere Speicherung gilt: Löschung auf Anfrage innerhalb von [7] Tagen und automatisch [30] Tage nach Vertragsende.
- **Einstellung des Dienstes:** Ankündigung mindestens [6 Monate] vorher, Export bleibt bis dahin möglich. [Option: Quellcode-Hinterlegung (Escrow) für Partner ab Stufe Pro.]

## 7. Auftragsverarbeitungsvertrag (AVV)
Sobald Kundendaten gespeichert werden (gespeicherte Städte, Erinnerungen), schließen wir einen AVV nach Art. 28 DSGVO ab.
Entwurf: `AVV_ENTWURF.md`. Heute, ohne Speicherung, findet nur eine kurzzeitige Verarbeitung während der Berechnung statt.
**Ob dafür bereits ein AVV nötig ist, bitte rechtlich prüfen lassen.**
