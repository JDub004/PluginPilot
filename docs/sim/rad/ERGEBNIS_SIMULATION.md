# Datei-Rad: Ergebnis der Simulation (18.10.2026)

> KI-simulierte Gespräche, keine echten Kunden. Sie zeigen wahrscheinliche Einwände, beweisen aber keine Nachfrage.
> Gezeigt wurde: das Datei-Rad (Format, Zuschneiden, Drehen, Größe, Verkleinern, Filter, Zu PDF, Speichern; alles im Browser) und die Idee „Für welches Portal?“-Vorgaben, Firmen-Version, Einbettung für Portale.

## 0. Recherche vorab (Upload-Vorgaben)
| Portal | Was belegt ist | Quelle | Sicherheit |
|---|---|---|---|
| ELSTER Belegnachreichung | 10,4 MB je Anhang, 14 MB gesamt, max. 100 PDF-Seiten je Anhang, PDF | [ELSTER-Forum, zitiert Formularhilfe](https://forum.elster.de/anwenderforum/forum/elster-webanwendungen/mein-elster/412772-maximale-dateigrößen-bei-belegnachreichungen-viel-zu-klein) | mittel (Forum, nicht offizielle Seite) |
| Bundesagentur für Arbeit (Portal) | PDF, JPG, PNG, BMP; lieber mehrere kleine Dateien; PDF/A empfohlen; Dokumente werden konvertiert | [BA-Anleitung (Stand 09.02.2026)](https://www.arbeitsagentur.de/datei/anleitung-zum-hochladen-von-umfangreichen-dokumenten_ba146460.pdf) | hoch für Formate, **keine** MB-Grenze gefunden |
| Stadt Köln Elternbeiträge (Kita) | 5 MB je Datei, 15 MB gesamt; JPG, PNG, PDF | [stadt-koeln.de](https://www.stadt-koeln.de/service/onlinedienste/elternbeitraege/index.html) | hoch (offizielle Seite) |
| ElterngeldDigital | keine Grenzen veröffentlicht | [Familienportal](https://familienportal.de/bmbfsfj/themen/familie/smarte-gesellschaftspolitik/elterngeld-digital-189824) | – |
| Vinted | bis 20 Fotos; Anzeige 4:5 (1080 × 1350) | Ratgeber Dritter ([parcel2go](https://parcel2go.com/content-hub/boost-your-vinted-listings), [marszalstudio](https://marszalstudio.pl/en/vinted-photos-tips/)) | niedrig |

**Folge:** Eine vollständige „garantiert passend“-Datenbank ist **nicht** ehrlich machbar. Grenzen sind oft unveröffentlicht und je Bundesland/Stadt verschieden. Das Produkt muss die Grenze **aus der Fehlermeldung bzw. Hilfe übernehmen** können („max. 5 MB, nur PDF“) und Vorgaben nur mit Quelle und Sicherheit zeigen.

## 1. Überblick
| Persona | Typ | Kauf | Zahlungsbereitschaft | Bester Moment | Schwächster Moment |
|---|---|---|---|---|---|
| Sabine K. | Steuerfachangestellte, Kanzlei 9 MA | Firmen-Version 40 % | 5 €/Platz/Monat oder 300 €/Jahr Kanzlei-Pauschale | „Mandanten schicken 23 Handyfotos, ich brauche **ein** PDF unter 10 MB fürs Finanzamt“; nichts wird hochgeladen (iLovePDF ist bei ihnen verboten) | Rad ist „verspielt“; braucht Liste mit Reihenfolge, nicht Kreis |
| Dr. Mehmet A. | Hausarztpraxis, 6 MA | 20 % | nur über Praxissoftware-Anbieter, nicht selbst | Arztbriefe, Befunde als Foto → PDF, ohne Cloud | will keine neue Software; ist nur realistisch eingebettet in vorhandene Systeme |
| Lena W. | HR-Generalistin, 300 MA | 30 % | IT entscheidet, nachweisbar „lokal“ nötig, 2–4 €/Platz | Bewerber-Unterlagen zusammenführen, Seiten drehen und aufteilen | braucht **PDF zusammenfügen/aufteilen** zuerst; Bilder-Funktionen sind zweitrangig |
| Tobias R. | Hausverwaltung, 1.800 Einheiten | Einbettung 25 % | 99–199 €/Monat, wenn Support-Tickets sinken | Mieterportal: „Datei zu groß“ ist Ticket-Grund Nr. 2; Hinweis „Hier anpassen“ direkt im Portal | eigener Portal-Anbieter muss mitspielen; Entscheidung dauert Monate |
| Julia M. | privat, 2 Kinder | Gratis 95 %, zahlen 0 % | 0 € (höchstens 2 € einmalig) | Elterngeld/Kita: „PDF unter 5 MB“ in 20 s ohne Anmeldung; per Handy über „Teilen“ | würde **nie** etwas herunterladen oder bezahlen; findet es nur über Google/ChatGPT |

**Kurzfazit:** Privatleute nutzen es gern, zahlen aber nie: Sie sind Reichweite. Bezahlt wird von **Kanzleien/HR (lokal + PDF-Werkzeuge)** und später von **Portalen (Einbettung)**. Niemand will einen Download.

## 2. Einig in allen Gesprächen
**Wert:**
1. **PDF verkleinern, zusammenfügen, aufteilen, Seiten drehen und sortieren.** Das wird öfter gebraucht als jede Bildfunktion (5/5).
2. **„Nichts wird hochgeladen“ nachweisbar** (4/5, für Firmen entscheidend): eine Seite zum Weitergeben an die IT.
3. **Ziel statt Format:** „Max. ___ MB, Format ___, eine Datei“ eingeben → Ergebnis passt. Vorgaben-Liste nur als Abkürzung (5/5).
4. **Handyfotos von Papier** müssen wie ein Scan aussehen: gerade, weiß, lesbar (4/5).

**Ablehnung:**
1. **Download/Installation** (5/5). 2. **Konto/Anmeldung** für Grundfunktionen (5/5). 3. **Rad als einzige Bedienung** für viele Dateien (Kanzlei, HR): Rad für die Wahl, darunter eine **Seitenliste** zum Sortieren. 4. **„Garantiert passend“** ohne Quelle (Kanzlei: „wenn das Finanzamt es ablehnt, bin ich schuld“).

## 3. Entscheidung (GO, schmaler Zuschnitt)
**Jetzt bauen (ohne Konten, ohne Server-Verarbeitung):**
1. **PDF-Werkzeuge im Browser:** zusammenfügen, aufteilen, Seiten drehen/löschen/sortieren, verkleinern (Seiten als Bild neu aufbauen; klar gekennzeichnet, dass Text dann nicht mehr markierbar ist).
2. **Bilder + PDFs gemischt** zu einem PDF (Belege-Fall).
3. **Ziel-Modus „Passend machen“:** Grenze (MB), Format, eine/mehrere Dateien → automatische Kette (zusammenfügen → verkleinern → umbenennen). Vorgaben mit **Quelle, Prüfdatum, Sicherheit**; ohne Quelle keine Vorgabe.
4. **Scan-Look** für Handyfotos (Graustufen, Kontrast, weißer Hintergrund). Geraderichten mit 4 Ecken erst nach echter Nachfrage.
5. **Seitenliste** unter dem Rad (Reihenfolge per Ziehen).
6. **Nachweis-Seite für die IT:** wie lokal geprüft werden kann (CSP, Netzwerk-Tab), was nicht stimmt (Hosting-Logs).

**Nicht bauen:** Download-App, Konten, Bezahlung, Hintergrund entfernen, OCR (erst nach Validierung).

**Preise (Hypothesen):** Privat gratis · Team 4 €/Platz/Monat bzw. Kanzlei-Pauschale 290 €/Jahr (eigene Vorgaben, Logo, IT-Nachweis) · Portal-Einbettung ab 99 €/Monat.

**Echte Validierung:** 3 Kanzleien, 2 HR-Abteilungen, 1 Hausverwaltung. Regel: ≥ 2 wollen nach 2 Wochen Pilot zahlen → Team-Version bauen. Reichweite messen: Besuche über „PDF verkleinern“-Seite ohne Werbung.
