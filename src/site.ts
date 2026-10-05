// Public pages required for plugin submission: website, support, privacy policy, terms.
// Rendered server-side from env so operator details are never hard-coded.
import type { Env } from './config/env.js';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const STYLE = `
:root { --bg:#f6f7f8; --surface:#fff; --ink:#1c2430; --muted:#5d6877; --line:#dde2e8; --accent:#1f5a73; }
@media (prefers-color-scheme: dark) { :root { --bg:#14181d; --surface:#1c2229; --ink:#e6eaef; --muted:#9aa5b2; --line:#2e3640; --accent:#6fb3cf; color-scheme: dark } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
nav { display:flex; flex-wrap:wrap; gap:14px; font-size:14px; margin-bottom:28px; }
a { color: var(--accent); }
h1 { font-size: 28px; line-height: 1.2; margin: 0 0 8px; text-wrap: balance; }
h2 { font-size: 19px; margin: 28px 0 6px; }
p, li { max-width: 65ch; }
.muted { color: var(--muted); }
.card { background: var(--surface); border:1px solid var(--line); border-radius:10px; padding:16px; margin:16px 0; }
img.logo { width:56px; height:56px; border-radius:12px; }
code { font-family: ui-monospace, Menlo, monospace; font-size: 14px; }`;

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><link rel="icon" href="/assets/surcharge-check.svg"><style>${STYLE}</style></head><body><main>
<nav><a href="/city">Software-Stadt</a><a href="/surcharge">Surcharge Check</a><a href="/support">Support</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/imprint">Imprint</a><a href="/playground">Try it</a></nav>
${body}</main></body></html>`;
}

const UPDATED = '2026-10-05';

export function renderSite(path: string, env: Env): string | undefined {
  const name = esc(env.OPERATOR_NAME);
  const email = esc(env.CONTACT_EMAIL);
  const addr = esc(env.OPERATOR_ADDRESS);
  const country = esc(env.OPERATOR_COUNTRY);

  switch (path) {
    case '/surcharge':
      return page('Surcharge Check', `
<img class="logo" src="/assets/surcharge-check.svg" alt="Surcharge Check logo">
<h1>Surcharge Check</h1>
<p class="muted">Audit ocean freight surcharges inside ChatGPT.</p>
<p>Since the Strait of Hormuz closed in March 2026, carriers have stacked war risk, emergency conflict, emergency bunker and cost recovery surcharges on top of base freight. Many shippers pay surcharges that were announced for other lanes, other dates or lower amounts.</p>
<p>Surcharge Check compares every charge line of your quote or invoice with a curated database of carrier announcements: scope, effective date, cargo-in-transit rules, later dates for US (FMC-regulated) trades, and announced amounts. It flags duplicates and conflicts with all-in rates, shows the amount you can dispute with the source for each line, and drafts a dispute letter.</p>
<div class="card"><b>How to use it:</b> connect Surcharge Check in ChatGPT, paste your freight invoice and ask “Are these surcharges legitimate?”. No account, no login.</div>
<h2>What it is not</h2>
<p>It does not quote freight, book shipments or give legal advice. Entries based on trade press are marked and must be confirmed with the carrier before you rely on them.</p>`);

    case '/city':
      return page('Software-Stadt', `
<img class="logo" src="/assets/software-stadt.svg" alt="Software-Stadt Logo">
<h1>Software-Stadt</h1>
<p class="muted">Die Software deiner Firma als begehbare Stadt, direkt in ChatGPT.</p>
<p>Jede Abteilung wird ein Stadtviertel, jedes Programm ein Gebäude: Häuser für selten genutzte Tools, Türme für die großen Systeme. Datenflüsse sind Wege, auf denen Pakete laufen. Ein Diamant über jedem Gebäude zeigt den Zustand: grün, gelb oder rot.</p>
<p>Die Software-Stadt findet automatisch Aufgaben: doppelte Tools, ungenutzte Lizenzen mit Sparpotenzial, kritische Daten in Excel-Dateien, Programme ohne Verantwortlichen, Schatten-IT und Dateninseln. Ein Klick auf eine Aufgabe führt zum betroffenen Gebäude.</p>
<div class="card"><b>So geht's:</b> Software-Stadt in ChatGPT verbinden und sagen: „Zeig mir unsere Software als Stadt.“ ChatGPT fragt Abteilung für Abteilung nach, welche Programme ihr nutzt. Eine Excel-Liste mit euren Tools funktioniert auch.</div>
<h2>Funktionen</h2>
<ul><li><b>Import:</b> Excel-Liste einfügen (<a href="/city/vorlage.csv">Vorlage herunterladen</a>) oder den Buchhaltungs-/Bank-Export: rund 40 bekannte Programme werden in den Buchungen erkannt, mit Kosten pro Monat.</li><li><b>Teilen:</b> Jede Stadt bekommt einen Link. Die Daten stecken nur im Link, nicht auf unserem Server.</li><li><b>Vorher / Nachher:</b> Nach dem Aufräumen zeigt die Stadt, welche Aufgaben erledigt sind und wie die Gesundheit gestiegen ist.</li><li><b>Bericht:</b> Kennzahlen, Aufgaben mit Ersparnis und Programme je Abteilung als Bericht für die Geschäftsführung, auf Wunsch mit dem Namen eures IT-Dienstleisters.</li></ul>
<h2>Für wen?</h2>
<ul><li>Geschäftsführung und Büroleitung in kleinen und mittleren Firmen, die den Überblick über ihre Tools und Kosten wollen</li><li>IT-Dienstleister, die die Landschaft ihrer Kunden verständlich zeigen wollen</li><li>Neue Mitarbeitende, die die Werkzeuge der Firma kennenlernen</li></ul>
<h2>Datenschutz</h2>
<p>Kein Konto, kein Login. Der Server berechnet die Stadt im Arbeitsspeicher und speichert keine Inhalte, auch nicht beim Teilen-Link. <a href="/privacy">Datenschutzerklärung</a></p>
<p><a href="/playground">Ausprobieren</a></p>`);

    case '/support':
      return page('Support – Surcharge Check', `
<h1>Support</h1>
<p>Questions, wrong results or a carrier announcement we should add? Write to <b>${email}</b>. Please include the carrier, the lane and the date of the announcement, and remove personal data from invoices you send.</p>
<h2>Reporting a wrong result</h2>
<p>Every result shows the database version and the source of each entry. Send us the version number and the charge line, and we correct the database, usually within a week.</p>
<h2>Other plugins by the same operator</h2>
<ul><li>Software-Stadt: Firmen-Software als interaktive Stadt</li><li>Trauerfall-Lotse: official steps and deadlines after a death in Germany</li><li>Geburts-Lotse: applications and deadlines after a birth in Germany</li></ul>`);

    case '/privacy':
      return page('Privacy Policy', `
<h1>Privacy Policy</h1>
<p class="muted">Last updated ${UPDATED}. Applies to Software-Stadt, Surcharge Check, Trauerfall-Lotse and Geburts-Lotse (“the plugins”).</p>
<h2>Controller</h2>
<p>${name}, ${addr}, ${country}. Contact: ${email}.</p>
<h2>What we process</h2>
<p>When ChatGPT calls a plugin, our server receives only the structured values needed for the check: for Surcharge Check the carrier, origin and destination country codes, dates, container types, charge labels and amounts; for the Lotsen a date and yes/no facts; for Software-Stadt the company name and a list of programs with department, user and licence counts, costs, owner (a role or a name, as entered by the user) and data flows. Names and addresses are optional in letter drafts and are not required for any check.</p>
<h2>What we do not do</h2>
<ul><li>We do not create user accounts and do not use cookies or tracking.</li>
<li>We do not store the content of requests. The server processes each request in memory and discards it.</li>
<li>We do not sell or share data, and do not use it to train models.</li></ul>
<h2>Logs</h2>
<p>We keep technical usage metrics without request content: which tool was called, whether it succeeded, duration, and the overall result category. Our hosting provider (Render, Frankfurt region) keeps standard access logs (IP address, time, path) for security purposes for a limited period.</p>
<h2>Legal basis and your rights</h2>
<p>Processing is necessary to provide the requested check (Art. 6(1)(b) GDPR) and in our legitimate interest in operating a secure service (Art. 6(1)(f) GDPR). You may request access, rectification, erasure, restriction and objection, and you may complain to a data protection authority. Because we do not store request content, there is usually nothing to disclose beyond technical logs.</p>
<h2>ChatGPT</h2>
<p>Your conversation with ChatGPT is governed by OpenAI's own privacy policy. We only receive what ChatGPT sends to the plugin.</p>`);

    case '/terms':
      return page('Terms of Service', `
<h1>Terms of Service</h1>
<p class="muted">Last updated ${UPDATED}. Provider: ${name}, ${addr}, ${country}. Contact: ${email}.</p>
<h2>Service</h2>
<p>The plugins provide automated, rule-based information: a map of a company's software with improvement hints, a surcharge audit against published carrier announcements, and deadline timelines based on German law. They are free of charge and provided as is.</p>
<h2>No legal or tax advice</h2>
<p>Results are not legal, tax or customs advice and do not replace a review by a qualified professional. Carrier tariffs, contracts and national rules can differ from the announcements in our database. Check the cited sources and your contract before you dispute a charge or act on a deadline.</p>
<h2>Liability</h2>
<p>We are liable without limitation for intent and gross negligence and for injury to life, body or health. Otherwise we are liable only for breaches of essential obligations, limited to the foreseeable, typical damage. Statutory liability that cannot be excluded remains unaffected.</p>
<h2>Acceptable use</h2>
<p>Do not use the plugins for unlawful purposes or to overload the service. We may limit access to protect the service.</p>
<h2>Changes</h2>
<p>We may update the plugins, the database and these terms. The version date above shows the current terms.</p>
<h2>Law</h2>
<p>The law of ${country} applies, without prejudice to mandatory consumer protection rules of your country of residence.</p>`);
    case '/imprint':
      return page('Imprint', `
<h1>Imprint</h1>
<p>Information according to § 5 DDG (German Digital Services Act):</p>
<p>${name}<br>${addr}<br>${country}</p>
<p>E-mail: ${email}</p>
<p class="muted">Responsible for content: ${name}, address as above.</p>`);
    default:
      return undefined;
  }
}
