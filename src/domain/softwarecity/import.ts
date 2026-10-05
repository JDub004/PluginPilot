import { AppSchema, type AppInput, type Category } from './schema.js';

/**
 * Deterministic importers for Software-Stadt. All input is untrusted text (pasted from Excel/Sheets or an
 * accounting export); every produced app is validated with AppSchema and rows that fail become warnings.
 */

export interface ImportResult { apps: AppInput[]; warnings: string[] }

const MAX_ROWS = 2000;

/** Known vendors → category. Matched as whole words against names/booking texts (lower-case). */
export const VENDORS: ReadonlyArray<[RegExp, string, Category]> = [
  [/\bsalesforce\b/, 'Salesforce', 'crm'], [/\bhubspot\b/, 'HubSpot', 'crm'], [/\bpipedrive\b/, 'Pipedrive', 'crm'],
  [/\bsap\b/, 'SAP', 'erp'], [/\bodoo\b/, 'Odoo', 'erp'], [/\bweclapp\b/, 'weclapp', 'erp'], [/\bxentral\b/, 'Xentral', 'erp'],
  [/\bdatev\b/, 'DATEV', 'accounting'], [/\blexoffice\b|\blexware\b/, 'Lexware Office', 'accounting'], [/\bsevdesk\b/, 'sevDesk', 'accounting'],
  [/\bpersonio\b/, 'Personio', 'hr'], [/\bfactorial\b/, 'Factorial', 'hr'],
  [/\bslack\b/, 'Slack', 'communication'], [/\bzoom\b/, 'Zoom', 'communication'], [/\bmicrosoft teams\b|\bms teams\b/, 'Microsoft Teams', 'communication'],
  [/\bmicrosoft 365\b|\bmicrosoft365\b|\boffice 365\b|\bm365\b/, 'Microsoft 365', 'collaboration'], [/\bgoogle workspace\b|\bg suite\b/, 'Google Workspace', 'collaboration'],
  [/\bnotion\b/, 'Notion', 'collaboration'], [/\basana\b/, 'Asana', 'collaboration'], [/\btrello\b/, 'Trello', 'collaboration'],
  [/\bmonday(\.com)?\b/, 'monday.com', 'collaboration'], [/\bmiro\b/, 'Miro', 'collaboration'], [/\bconfluence\b/, 'Confluence', 'collaboration'],
  [/\bdropbox\b/, 'Dropbox', 'storage'], [/\bbox\.com\b/, 'Box', 'storage'], [/\bwetransfer\b/, 'WeTransfer', 'storage'],
  [/\bgithub\b/, 'GitHub', 'dev'], [/\bgitlab\b/, 'GitLab', 'dev'], [/\bjira\b|\batlassian\b/, 'Jira', 'dev'],
  [/\bmailchimp\b/, 'Mailchimp', 'marketing'], [/\bcanva\b/, 'Canva', 'marketing'], [/\bbrevo\b|\bsendinblue\b/, 'Brevo', 'marketing'],
  [/\bzendesk\b/, 'Zendesk', 'support'], [/\bfreshdesk\b/, 'Freshdesk', 'support'], [/\bintercom\b/, 'Intercom', 'support'],
  [/\b1password\b/, '1Password', 'security'], [/\blastpass\b/, 'LastPass', 'security'],
  [/\bpower bi\b/, 'Power BI', 'analytics'], [/\btableau\b/, 'Tableau', 'analytics'],
  [/\bshopify\b/, 'Shopify', 'ecommerce'], [/\bshopware\b/, 'Shopware', 'ecommerce'],
  [/\bexcel\b|\.xlsx?\b|\bgoogle sheets\b/, 'Excel', 'spreadsheet'],
];

export function guessCategory(name: string): Category {
  const n = name.toLowerCase();
  for (const [re, , cat] of VENDORS) if (re.test(n)) return cat;
  return 'other';
}

// ---------------------------------------------------------------------------------------------
// Table import (CSV / TSV / semicolon, as pasted from Excel or saved as CSV)
// ---------------------------------------------------------------------------------------------

const HEADERS: Record<keyof AppInput, string[]> = {
  name: ['name', 'programm', 'software', 'tool', 'anwendung', 'app'],
  category: ['kategorie', 'category', 'art', 'typ'],
  department: ['abteilung', 'department', 'bereich', 'team'],
  users: ['nutzer', 'users', 'anwender', 'benutzer'],
  licenses: ['lizenzen', 'licenses', 'licences', 'seats', 'plätze'],
  monthlyCostEur: ['kosten', 'kosten/monat', 'kosten pro monat', 'monatliche kosten', 'cost', 'monthly cost', 'eur/monat', '€/monat'],
  owner: ['verantwortlich', 'owner', 'zuständig', 'ansprechpartner'],
  critical: ['kritisch', 'critical', 'geschäftskritisch'],
  approved: ['freigegeben', 'approved', 'genehmigt'],
  importance: ['wichtigkeit', 'importance', 'priorität', 'prioritaet', 'priority'],
  site: ['standort', 'site', 'location', 'niederlassung'],
  dataFlowsTo: ['daten an', 'datenfluss', 'data flows to', 'sendet an', 'schnittstellen'],
};

const CATEGORY_WORDS: Record<string, Category> = {
  crm: 'crm', vertrieb: 'crm', erp: 'erp', warenwirtschaft: 'erp', buchhaltung: 'accounting', accounting: 'accounting', finanzen: 'accounting',
  personal: 'hr', hr: 'hr', kommunikation: 'communication', communication: 'communication', chat: 'communication',
  zusammenarbeit: 'collaboration', collaboration: 'collaboration', projekt: 'collaboration', projektmanagement: 'collaboration',
  dateiablage: 'storage', storage: 'storage', ablage: 'storage', tabelle: 'spreadsheet', tabellen: 'spreadsheet', spreadsheet: 'spreadsheet',
  entwicklung: 'dev', dev: 'dev', marketing: 'marketing', kundenservice: 'support', support: 'support', sicherheit: 'security',
  security: 'security', auswertung: 'analytics', analytics: 'analytics', bi: 'analytics', onlineshop: 'ecommerce', shop: 'ecommerce',
  ecommerce: 'ecommerce', sonstiges: 'other', other: 'other',
};

export function splitRows(text: string): string[][] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, MAX_ROWS + 1);
  if (lines.length === 0) return [];
  const head = lines[0] as string;
  const delim = head.includes('\t') ? '\t' : (head.split(';').length >= head.split(',').length ? ';' : ',');
  return lines.map((l) => splitLine(l, delim));
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') quoted = false; else cur += ch;
    } else if (ch === '"' && cur.trim() === '') quoted = true;
    else if (ch === delim) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** "1.234,50 €" → 1234.5, "1,234.50" → 1234.5, "49" → 49. */
export function parseNumber(raw: string): number | undefined {
  let s = raw.replace(/[€\s]|eur/gi, '');
  if (s === '' || s === '-') return undefined;
  const neg = s.startsWith('-');
  s = s.replace(/^[-+]/, '');
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s) || /^\d+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  return neg ? -n : n;
}

const yes = (s: string) => /^(ja|j|yes|y|x|true|1|wahr)$/i.test(s.trim());
const no = (s: string) => /^(nein|n|no|false|0|falsch)$/i.test(s.trim());

export function importTable(text: string): ImportResult {
  const rows = splitRows(text);
  const warnings: string[] = [];
  if (rows.length < 2) return { apps: [], warnings: ['Tabelle braucht eine Kopfzeile und mindestens eine Zeile mit einem Programm.'] };
  if (rows.length > MAX_ROWS) warnings.push(`Nur die ersten ${MAX_ROWS} Zeilen wurden gelesen.`);
  const header = (rows[0] as string[]).map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
  const col = {} as Partial<Record<keyof AppInput, number>>;
  for (const key of Object.keys(HEADERS) as (keyof AppInput)[]) {
    const idx = header.findIndex((h) => HEADERS[key].includes(h));
    if (idx >= 0) col[key] = idx;
  }
  if (col.name === undefined) return { apps: [], warnings: ['Keine Spalte "Programm" oder "Name" gefunden. Bitte Kopfzeile prüfen.'] };

  const apps: AppInput[] = [];
  rows.slice(1, MAX_ROWS + 1).forEach((cells, i) => {
    const line = i + 2;
    const get = (k: keyof AppInput) => (col[k] === undefined ? '' : (cells[col[k] as number] ?? '').trim());
    const name = get('name');
    if (!name) return;
    const catRaw = get('category').toLowerCase();
    const category = (CATEGORY_WORDS[catRaw] ?? (catRaw ? undefined : guessCategory(name))) ?? guessCategory(name);
    const num = (k: keyof AppInput) => { const v = get(k); if (!v) return undefined; const n = parseNumber(v); if (n === undefined || n < 0) warnings.push(`Zeile ${line}: "${v.slice(0, 20)}" ist keine Zahl (${k}).`); return n !== undefined && n >= 0 ? n : undefined; };
    const users = num('users');
    const licenses = num('licenses');
    const monthlyCostEur = num('monthlyCostEur');
    const importance = num('importance');
    const crit = get('critical');
    const appr = get('approved');
    const candidate = {
      name, category, department: get('department') || 'Alle',
      ...(users !== undefined ? { users: Math.round(users) } : {}),
      ...(licenses !== undefined ? { licenses: Math.round(licenses) } : {}),
      ...(monthlyCostEur !== undefined ? { monthlyCostEur: Math.round(monthlyCostEur * 100) / 100 } : {}),
      ...(get('owner') ? { owner: get('owner') } : {}),
      ...(importance !== undefined ? { importance: Math.min(5, Math.max(1, Math.round(importance))) } : {}),
      ...(get('site') ? { site: get('site') } : {}),
      critical: yes(crit),
      approved: !no(appr),
      dataFlowsTo: get('dataFlowsTo').split(/[,/|+]/).map((s) => s.trim()).filter(Boolean).slice(0, 20),
    };
    const parsed = AppSchema.safeParse(candidate);
    if (parsed.success) apps.push(parsed.data);
    else warnings.push(`Zeile ${line} (${name.slice(0, 30)}) übersprungen: ${parsed.error.issues[0]?.message ?? 'ungültig'}.`);
  });
  if (apps.length > 120) { warnings.push('Mehr als 120 Programme: nur die ersten 120 werden gezeigt.'); apps.length = 120; }
  return { apps, warnings };
}

// ---------------------------------------------------------------------------------------------
// Accounting export import (DATEV/Lexware/bank CSV): find software vendors in booking texts
// ---------------------------------------------------------------------------------------------

const TEXT_COLS = ['buchungstext', 'verwendungszweck', 'text', 'beschreibung', 'kreditor', 'empfänger', 'name', 'lieferant', 'zahlungsempfänger', 'description', 'payee'];
const AMOUNT_COLS = ['betrag', 'umsatz', 'amount', 'brutto', 'netto', 'soll', 'betrag (eur)', 'umsatz (ohne soll/haben-kz)'];
const DATE_COLS = ['datum', 'belegdatum', 'buchungstag', 'buchungsdatum', 'date', 'valuta'];

/** Parses German/ISO dates to "YYYY-MM"; undefined if unknown. */
function month(raw: string): string | undefined {
  let m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) { const y = (m[3] as string).length === 2 ? `20${m[3]}` : m[3]; return `${y}-${(m[2] as string).padStart(2, '0')}`; }
  m = raw.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (m) return `${m[1]}-${m[2]}`;
  m = raw.match(/^(\d{1,2})(\d{2})$/); // DATEV "Belegdatum" DDMM
  if (m) return `----${m[2]}`;
  return undefined;
}

export function importLedger(text: string): ImportResult {
  const rows = splitRows(text);
  const warnings: string[] = [];
  if (rows.length < 2) return { apps: [], warnings: ['Export braucht eine Kopfzeile und Buchungszeilen.'] };
  const header = (rows[0] as string[]).map((h) => h.toLowerCase().trim());
  const textIdx = header.map((h, i) => (TEXT_COLS.includes(h) ? i : -1)).filter((i) => i >= 0);
  const amountIdx = header.findIndex((h) => AMOUNT_COLS.includes(h));
  const dateIdx = header.findIndex((h) => DATE_COLS.includes(h));
  if (textIdx.length === 0 || amountIdx < 0) {
    return { apps: [], warnings: ['Spalten für Buchungstext/Empfänger und Betrag nicht gefunden.'] };
  }
  const found = new Map<string, { category: Category; total: number; months: Set<string>; count: number }>();
  const allMonths = new Set<string>();
  for (const cells of rows.slice(1, MAX_ROWS + 1)) {
    const hay = textIdx.map((i) => cells[i] ?? '').join(' ').toLowerCase();
    const amount = parseNumber(cells[amountIdx] ?? '');
    const mon = dateIdx >= 0 ? month((cells[dateIdx] ?? '').trim()) : undefined;
    if (mon) allMonths.add(mon);
    if (amount === undefined) continue;
    const vendor = VENDORS.find(([re]) => re.test(hay));
    if (!vendor) continue;
    const [, vname, cat] = vendor;
    const e = found.get(vname) ?? { category: cat, total: 0, months: new Set<string>(), count: 0 };
    e.total += Math.abs(amount);
    e.count++;
    if (mon) e.months.add(mon);
    found.set(vname, e);
  }
  const span = Math.max(1, allMonths.size);
  if (allMonths.size === 0) warnings.push('Kein Datum erkannt: Kosten wurden als ein Monat gerechnet.');
  const apps: AppInput[] = [...found.entries()].sort((a, b) => b[1].total - a[1].total).map(([name, e]) => AppSchema.parse({
    name, category: e.category, department: 'Alle', monthlyCostEur: Math.round((e.total / span) * 100) / 100,
  }));
  if (apps.length === 0) warnings.push('Keine bekannte Software in den Buchungen gefunden.');
  else warnings.push(`Aus ${span} Monat(en) Buchungen gemittelt. Abteilung, Nutzer und Lizenzen bitte ergänzen.`);
  return { apps: apps.slice(0, 120), warnings };
}

/** Merge imported apps: later sources fill gaps of earlier ones (matched by name, case-insensitive). */
export function mergeApps(...lists: AppInput[][]): AppInput[] {
  const byName = new Map<string, AppInput>();
  for (const list of lists) for (const a of list) {
    const k = a.name.toLowerCase();
    const prev = byName.get(k);
    byName.set(k, prev ? { ...a, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== undefined)) } as AppInput : a);
  }
  return [...byName.values()].slice(0, 120);
}
