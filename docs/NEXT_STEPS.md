# Was du noch tun musst (Stand 2026-10-05)

Alles andere ist fertig. Diese Punkte gehen nur mit deinen Konten.

## 1. Render: neue Version live schalten (2 Min.)
dashboard.render.com → Dienst **trauerfall-lotse** → **Manual Deploy → Deploy latest commit**.
Danach unter **Environment** eintragen (für Datenschutz, AGB und Impressum):
- `OPERATOR_NAME`: dein Name oder Firma
- `OPERATOR_ADDRESS`: ladungsfähige Anschrift
- `CONTACT_EMAIL`: Support-E-Mail
- `OPERATOR_COUNTRY`: steht auf Germany

Prüfen: https://trauerfall-lotse.onrender.com/privacy zeigt deine Daten statt Platzhaltern.
Tipp: Wenn Render nicht automatisch neu baut, unter Settings → Build & Deploy das GitHub-Repo verbinden und Auto-Deploy einschalten.

## 2. OpenAI-Entwicklerkonto (10 Min.)
- Auf platform.openai.com anmelden und eine Organisation anlegen (oder die bestehende nutzen).
- Unter Organisation → Einstellungen die **Identitätsprüfung** (Einzelperson oder Firma) abschließen. Der Name erscheint im Verzeichnis.

## 3. Demo-Video hochladen (3 Min.)
`submission/surcharge-check/assets/demo.webm` als **nicht gelistetes** Video hochladen (YouTube oder Loom) und den Link kopieren.

## 4. Einreichen (15 Min. pro Plugin)
Zwei Pakete sind fertig: `submission/surcharge-check-1.0.0.zip` und `submission/software-stadt-1.0.0.zip` (jeweils mit REVIEW.md und Demo-Video).

Im Plugin-Portal von OpenAI:
1. ZIP hochladen: `submission/surcharge-check-1.0.0.zip` (neu bauen mit `scripts/package-surcharge.sh`).
2. Felder aus `submission/surcharge-check/REVIEW.md` übernehmen: URLs, 5 positive + 3 negative Testfälle, Release Notes, Video-Link.
3. Domain-Verifizierung: Token aus dem Portal in Render als `OPENAI_APPS_CHALLENGE` eintragen, auf den Redeploy warten, dann im Portal auf **Verify** klicken.
4. Richtlinien bestätigen → **Submit for review**.

## Optional, aber empfohlen
- **ChatGPT-Test:** Mit einem bezahlten Abo im Entwicklermodus `…/surcharge/mcp` verbinden und die Prompts aus `tests/evaluation/prompts.surcharge.json` testen. So sehen wir vor dem Review, ob ChatGPT das Plugin zuverlässig auswählt.
- **Eigene Domain:** z. B. surchargecheck.com in Render hinzufügen; dann die URLs in `plugin.json` und `REVIEW.md` anpassen.
- **Bezahlter Render-Tarif (~7 $/Monat):** kein Schlafmodus, damit die erste Antwort im Review nicht in einen Timeout läuft.

## Software-Stadt v1.1 (2026-10-05): Import, Teilen, Vorher/Nachher, Bericht
1. Bei Render erneut **Manual Deploy → Deploy latest commit** klicken.
2. Testen: https://trauerfall-lotse.onrender.com/city/vorlage.csv herunterladen (Excel-Vorlage), Produktseite /city ansehen.
3. In ChatGPT (sobald verbunden): Excel-Liste einfügen → „Mach daraus eine Software-Stadt“ → Teilen-Link öffnen → „Bericht herunterladen“.
4. Vor dem Einreichen: Werkzeug-Liste im Portal neu scannen lassen (jetzt 2 Tools).
