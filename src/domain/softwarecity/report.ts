import { de } from './actions.js';
import type { CityInput, CityMap, Quest } from './schema.js';

/** Before/after comparison of two cities built from the same company. Quests are matched by kind + title. */
export interface CityComparison {
  healthBefore: number; healthAfter: number;
  costBefore: number; costAfter: number;
  appsBefore: number; appsAfter: number;
  savingsBefore: number; savingsAfter: number;
  solved: string[]; added: string[];
}

const key = (q: Quest) => `${q.kind}|${q.title}`;

export function compareCities(before: CityMap, after: CityMap): CityComparison {
  const b = new Map(before.quests.map((q) => [key(q), q.title]));
  const a = new Map(after.quests.map((q) => [key(q), q.title]));
  return {
    healthBefore: before.stats.healthScore, healthAfter: after.stats.healthScore,
    costBefore: before.stats.monthlyCostEur, costAfter: after.stats.monthlyCostEur,
    appsBefore: before.stats.apps, appsAfter: after.stats.apps,
    savingsBefore: before.stats.potentialSavingsEurYear, savingsAfter: after.stats.potentialSavingsEurYear,
    solved: [...b].filter(([k]) => !a.has(k)).map(([, t]) => t),
    added: [...a].filter(([k]) => !b.has(k)).map(([, t]) => t),
  };
}

const eur = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`;
const SEV: Record<Quest['severity'], string> = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };

/** Markdown report for management. Deterministic: same input, same text. */
export function renderReport(city: CityMap, opts: { preparedBy?: string; date?: string; comparison?: CityComparison } = {}): string {
  const s = city.stats;
  const lines: string[] = [];
  lines.push(`# Software-Bericht: ${city.company}`);
  lines.push('');
  const by = opts.preparedBy ?? city.brand?.name;
  const meta = [opts.date ? `Stand ${opts.date}` : '', by ? `erstellt von ${by}` : ''].filter(Boolean).join(' · ');
  if (meta) lines.push(`_${meta}_`, '');
  lines.push('## Überblick', '');
  lines.push('| Kennzahl | Wert |', '|---|---|');
  lines.push(`| Softwarekosten pro Jahr | ${eur(s.monthlyCostEur * 12)} |`, `| Davon vermeidbar (geschätzt) | ${eur(s.potentialSavingsEurYear)} pro Jahr |`);
  lines.push(`| Dringende Risiken | ${s.urgent} |`, `| Kündigungsfristen in den nächsten 90 Tagen | ${s.deadlines} |`, `| Programme / Abteilungen | ${s.apps} / ${s.districts} |`, '');
  if (opts.comparison) {
    const c = opts.comparison;
    lines.push('## Vorher / Nachher', '');
    lines.push('| | Vorher | Nachher |', '|---|---|---|');
    lines.push(`| Offene Aufgaben (gewichtet, 0–100 = keine) | ${c.healthBefore} | ${c.healthAfter} |`, `| Programme | ${c.appsBefore} | ${c.appsAfter} |`);
    lines.push(`| Kosten pro Monat | ${eur(c.costBefore)} | ${eur(c.costAfter)} |`, `| Offenes Sparpotenzial/Jahr | ${eur(c.savingsBefore)} | ${eur(c.savingsAfter)} |`, '');
    if (c.solved.length) lines.push(`**Erledigt (${c.solved.length}):** ${c.solved.join('; ')}`, '');
    if (c.added.length) lines.push(`**Neu (${c.added.length}):** ${c.added.join('; ')}`, '');
  }
  lines.push('## Aufgaben nach Dringlichkeit', '');
  if (city.quests.length === 0) lines.push('Keine Auffälligkeiten in den angegebenen Daten.');
  else {
    lines.push('| Dringlichkeit | Aufgabe | Ersparnis/Jahr |', '|---|---|---|');
    for (const q of city.quests) lines.push(`| ${SEV[q.severity]} | ${q.title.replace(/\|/g, '/')} | ${q.savingEurYear ? eur(q.savingEurYear) : '–'} |`);
  }
  lines.push('', '## Programme nach Abteilung', '');
  for (const d of city.districts) {
    const names = d.buildingIds.map((id) => city.buildings.find((b) => b.id === id)?.name).filter(Boolean);
    lines.push(`- **${d.name}:** ${names.join(', ')}`);
  }
  const nameOf = (ids: string[]) => ids.map((id) => city.buildings.find((b) => b.id === id)?.name).filter(Boolean).join(', ');
  const cell = (v?: string) => (v ?? '–').replace(/\|/g, '/');
  const deadlines = city.buildings.filter((b) => b.noticeDeadline).sort((x, y) => (x.noticeDeadline! < y.noticeDeadline! ? -1 : 1));
  if (deadlines.length) {
    lines.push('', '## Vertragsfristen', '', '| Programm | Kündigen bis | Vertragsende | Kosten/Jahr |', '|---|---|---|---|');
    for (const b of deadlines) lines.push(`| ${cell(b.name)} | ${de(b.noticeDeadline!)} | ${de(b.renewalDate!)} | ${b.monthlyCostEur ? eur(b.monthlyCostEur * 12) : '–'} |`);
  }
  const critical = city.buildings.filter((b) => b.critical);
  if (critical.length) {
    lines.push('', '## Notfall-Kontakte (kritische Programme)', '', '| Programm | Verantwortlich | Kontakt | Externer Partner |', '|---|---|---|---|');
    for (const b of critical) {
      const p = city.people.find((x) => x.buildingIds.includes(b.id));
      const ext = city.partners.filter((x) => x.buildingIds.includes(b.id)).map((x) => [x.name, x.phone ?? x.email].filter(Boolean).join(' ')).join('; ');
      lines.push(`| ${cell(b.name)} | ${cell(p?.name ?? b.owner ?? 'niemand')} | ${cell([p?.phone, p?.email].filter(Boolean).join(', ') || undefined)} | ${cell(ext || undefined)} |`);
    }
  }
  if (city.people.length) {
    lines.push('', '## Ansprechpartner', '', '| Name | Rolle | Abteilung | Kontakt | Zuständig für |', '|---|---|---|---|---|');
    for (const p of city.people) lines.push(`| ${cell(p.name)} | ${cell(p.role)} | ${cell(p.district)} | ${cell([p.email, p.phone].filter(Boolean).join(', ') || undefined)} | ${cell(nameOf(p.buildingIds) || undefined)} |`);
  }
  if (city.sites.length) {
    lines.push('', '## Standorte', '');
    for (const s of city.sites) lines.push(`- **${s.name}**${s.main ? ' (Zentrale)' : ''}${s.city ? `, ${s.city}` : ''}${s.employees !== undefined ? `, ${s.employees} Mitarbeitende` : ''}: ${s.buildingIds.length} Programme`);
  }
  if (city.partners.length) {
    const KIND: Record<string, string> = { supplier: 'Lieferant', customer: 'Kunde', service_provider: 'Dienstleister', authority: 'Behörde', other: 'Partner' };
    lines.push('', '## Externes Netzwerk', '', '| Partner | Art | Ort | Kontakt | Verbunden über |', '|---|---|---|---|---|');
    for (const p of city.partners) lines.push(`| ${cell(p.name)} | ${KIND[p.kind]} | ${cell(p.city)} | ${cell([p.contact, p.email, p.phone].filter(Boolean).join(', ') || undefined)} | ${cell(nameOf(p.buildingIds) || undefined)} |`);
  }
  lines.push('', `_${city.disclaimer}_`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Share link: the city input travels in the URL fragment (#d=…), which browsers never send to the
// server. Nothing is stored server-side.
// ---------------------------------------------------------------------------------------------

/** Share links can be forwarded freely, so personal contact details (e-mail, phone, notes) never go into them. */
export function shareSafe(input: CityInput): CityInput {
  const strip = <T extends { email?: string; phone?: string; note?: string }>({ email: _e, phone: _p, note: _n, ...rest }: T) => rest;
  return {
    ...input,
    ...(input.people ? { people: input.people.map((p) => strip(p) as typeof p) } : {}),
    ...(input.partners ? { partners: input.partners.map((p) => { const { contact: _c, ...r } = strip(p) as typeof p; return r as typeof p; }) } : {}),
  };
}

export function encodeShare(input: CityInput): string {
  return Buffer.from(JSON.stringify(input), 'utf8').toString('base64url');
}

export function decodeShare(data: string): unknown {
  if (data.length > 60_000 || !/^[A-Za-z0-9_-]+$/.test(data)) throw new Error('invalid share data');
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
}

/** Software inventory as CSV (semicolon, German Excel), e.g. for the Verzeichnis von Verarbeitungstätigkeiten or audits. */
export function inventoryCsv(city: CityMap): string {
  const q = (v: unknown) => { const t = v === undefined || v === null ? '' : String(v); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  // Headers match the import aliases, so the file can be edited in Excel and pasted back (round trip).
  const head = ['Programm', 'Kategorie', 'Abteilung', 'Standort', 'Nutzer', 'Lizenzen', 'Kosten/Monat', 'Verantwortlich', 'Kritisch', 'Freigegeben', 'Wichtigkeit', 'Vertragsende', 'Kündigungsfrist (Tage)', 'Daten an', 'Kündigen bis', 'Offene Aufgaben'];
  const rows = city.buildings.map((b) => [b.name, b.category, b.district === 'Marktplatz' ? 'Alle' : b.district, b.site ?? '', b.users, b.licenses, b.monthlyCostEur, b.owner ?? '', b.critical ? 'ja' : 'nein', b.approved ? 'ja' : 'nein', b.importance, b.renewalDate ?? '', b.noticePeriodDays, b.dataFlowsTo.join(', '), b.noticeDeadline ?? '', b.questIds.length]);
  return [head, ...rows].map((r) => r.map(q).join(';')).join('\n');
}
