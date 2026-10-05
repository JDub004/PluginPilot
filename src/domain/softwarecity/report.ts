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
  const meta = [opts.date ? `Stand ${opts.date}` : '', opts.preparedBy ? `erstellt von ${opts.preparedBy}` : ''].filter(Boolean).join(' · ');
  if (meta) lines.push(`_${meta}_`, '');
  lines.push('## Überblick', '');
  lines.push('| Kennzahl | Wert |', '|---|---|');
  lines.push(`| Programme | ${s.apps} |`, `| Abteilungen | ${s.districts} |`, `| Kosten pro Monat | ${eur(s.monthlyCostEur)} |`);
  lines.push(`| Sparpotenzial pro Jahr | ${eur(s.potentialSavingsEurYear)} |`, `| Stadt-Gesundheit | ${s.healthScore}/100 |`, '');
  if (opts.comparison) {
    const c = opts.comparison;
    lines.push('## Vorher / Nachher', '');
    lines.push('| | Vorher | Nachher |', '|---|---|---|');
    lines.push(`| Stadt-Gesundheit | ${c.healthBefore} | ${c.healthAfter} |`, `| Programme | ${c.appsBefore} | ${c.appsAfter} |`);
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
  lines.push('', `_${city.disclaimer}_`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Share link: the city input travels in the URL fragment (#d=…), which browsers never send to the
// server. Nothing is stored server-side.
// ---------------------------------------------------------------------------------------------

export function encodeShare(input: CityInput): string {
  return Buffer.from(JSON.stringify(input), 'utf8').toString('base64url');
}

export function decodeShare(data: string): unknown {
  if (data.length > 60_000 || !/^[A-Za-z0-9_-]+$/.test(data)) throw new Error('invalid share data');
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
}
