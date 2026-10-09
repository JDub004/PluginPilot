// ChatGPT Ads readiness: deterministic checks against OpenAI's published ad specs and policies.
// Nothing here models OpenAI's ranking; every rule says where it comes from.

export type Level = 'error' | 'warn' | 'ok';
export interface Finding { level: Level; code: string; message: string; source?: string }

export const CHECKED = '2026-10-09';
export const SOURCES = {
  specs: 'https://help.openai.com/en/articles/20001218-bulk-upload-campaign-schema-checklist',
  policy: 'https://openai.com/policies/ad-policies/',
  adGroups: 'https://help.openai.com/en/articles/20001211-create-ad-groups-for-chatgpt-ads',
  crawler: 'https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers',
} as const;

export const LIMITS = { title: { rec: [16, 24], max: 50 }, copy: { rec: [32, 48], max: 100 } } as const;

/** Simplified word lists derived from the public ad policy. A hit is a risk to check, not a rejection. */
export const POLICY: { re: RegExp; area: string; kind: 'disallowed' | 'restricted' }[] = [
  { re: /\b(casino|wetten|gambling|poker|sportwetten|lotterie|slots?)\b/i, area: 'Glücksspiel', kind: 'disallowed' },
  { re: /\b(dating|sex\w*|erotik\w*|porn\w*)\b/i, area: 'Dating/Erwachseneninhalte', kind: 'disallowed' },
  { re: /\b(cannabis|thc|psychedel\w*|alkohol\w*|wein|bier|vodka|whisky|gin)\b/i, area: 'Alkohol/Drogen', kind: 'disallowed' },
  { re: /\b(wahl\w*|partei\w*|politi\w*|election|kandidat\w*)\b/i, area: 'Politik', kind: 'disallowed' },
  { re: /\b(stellenangebot\w*|wir stellen ein|job(s)? bei|wohnung zu vermieten|immobilie zu verkaufen)\b/i, area: 'Jobs/Wohnungen', kind: 'disallowed' },
  { re: /\b(kredit\w*|darlehen|versicherung\w*|geldanlage|anlage\w*|krypto\w*|trading|steuer\w*|finanzamt\w*|finanz\w*)\b/i, area: 'Finanzen/Steuern', kind: 'restricted' },
  { re: /\b(arzt|ärzt\w*|therapie\w*|medikament\w*|heilung|heilt|gesundheit\w*|abnehm\w*|diät\w*)\b/i, area: 'Gesundheit', kind: 'restricted' },
  { re: /\b(anwalt|anwält\w*|rechtsberatung|kanzlei)\b/i, area: 'Rechtsberatung', kind: 'restricted' },
];
const HYPE = /\b(beste[rns]?|bestes|nr\.?\s?1|nummer eins|garantiert|100\s?%|revolution\w*|unschlagbar|schönste[rns]?|günstigste[rns]?)\b/i;

export interface AdInput { title: string; copy: string; url?: string; contextHints?: string[] }

export function lintAd(ad: AdInput): Finding[] {
  const f: Finding[] = [];
  const len = (s: string) => [...s].length;
  for (const [k, v, label] of [['title', ad.title, 'Titel'], ['copy', ad.copy, 'Text']] as const) {
    const l = len(v.trim()), lim = LIMITS[k];
    if (!l) f.push({ level: 'error', code: `${k}_empty`, message: `${label} fehlt.` });
    else if (l > lim.max) f.push({ level: 'error', code: `${k}_too_long`, message: `${label}: ${l} Zeichen, erlaubt sind höchstens ${lim.max}.`, source: SOURCES.specs });
    else if (l < lim.rec[0] || l > lim.rec[1]) f.push({ level: 'warn', code: `${k}_length`, message: `${label}: ${l} Zeichen, empfohlen ${lim.rec[0]}–${lim.rec[1]}.`, source: SOURCES.specs });
  }
  const all = `${ad.title} ${ad.copy}`;
  const hype = all.match(HYPE)?.[0];
  if (hype) f.push({ level: 'warn', code: 'unsupported_claim', message: `"${hype}" ist ein Superlativ bzw. Versprechen. Nur mit Beleg (Testsieg, Zahl) verwenden; Anzeigen dürfen nicht irreführen.`, source: SOURCES.policy });
  if (/!!|[A-ZÄÖÜ]{6,}/.test(all)) f.push({ level: 'warn', code: 'shouting', message: 'Großbuchstaben-Wörter oder "!!" wirken wie Werbung von gestern.' });
  for (const p of POLICY) {
    const hit = `${all} ${(ad.contextHints ?? []).join(' ')}`.match(p.re)?.[0];
    if (hit) f.push({ level: p.kind === 'disallowed' ? 'error' : 'warn', code: `policy_${p.kind}`, source: SOURCES.policy,
      message: `"${hit}": Bereich ${p.area} ist ${p.kind === 'disallowed' ? 'laut Ad-Richtlinie nicht erlaubt' : 'nur für freigegebene Werbetreibende erlaubt (manuelle Prüfung)'}. Heuristik nach Wortliste, Stand ${CHECKED}.` });
  }
  for (const h of ad.contextHints ?? []) if (h.trim().split(/\s+/).length < 5) f.push({ level: 'warn', code: 'hint_keyword', message: `Hinweis "${h}" ist ein Stichwort. OpenAI empfiehlt beschreibende Sätze (wer, Situation, Bedürfnis).`, source: SOURCES.adGroups });
  return f;
}

const STOP = new Set('und oder der die das ein eine einen für mit von zu im in auf ist sind wird den dem des bei nach aus wie was wer dein deine ihr ihre sie wir uns euch jetzt hier mehr alle ohne über the and for with your you our are'.split(' '));
const norm = (s: string) => s.toLowerCase().normalize('NFC');
const words = (s: string) => norm(s).replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').split(/\s+/).map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w.length > 3 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ungen|innen|ern|en|er|es|e|n|s)$/u, '');

/**
 * Ad terms that the landing page does not mention. German-aware: a term counts as present when the page contains it,
 * its stem, all parts of a hyphenated compound, or a page word ends with it (e.g. "Kündigungsfristen" covers "Fristen").
 * Deliberately a list, not a percentage: it is a to-do list, not a prediction of OpenAI's matching.
 */
export function missingTerms(ad: AdInput, landingText: string): string[] {
  const page = norm(landingText);
  const pageWords = new Set(words(landingText));
  const present = (t: string) => {
    if (page.includes(t) || page.includes(stem(t))) return true;
    if (t.includes('-') && t.split('-').filter((p) => p.length > 2).every((p) => page.includes(stem(p)))) return true;
    const s = stem(t);
    return s.length >= 4 && [...pageWords].some((w) => w.endsWith(s) || (w.length >= 5 && s.endsWith(stem(w))));
  };
  return [...new Set(words(`${ad.title} ${ad.copy}`))].filter((t) => !present(t));
}

export interface Offering { offer: string; audience: string; problems?: string[]; occasions?: string[]; alternatives?: string[]; place?: string }
export interface HintGroup { intent: string; hints: string[]; angle: string }

/** Descriptive context-hint sentences per user intent (who, situation, need), built from the advertiser's own words. */
export function contextHints(o: Offering): HintGroup[] {
  const at = o.place ? ` in ${o.place}` : '';
  const g: HintGroup[] = [
    { intent: 'Entdecken', angle: 'Klarer Kategorie-Titel: was es ist und für wen', hints: [`${cap(o.audience)}${at} sucht ${o.offer} und will wissen, welche Möglichkeiten es gibt.`] },
  ];
  for (const p of (o.problems ?? []).slice(0, 3)) g.push({ intent: 'Problem', angle: 'Problem im Titel, Lösung im Text', hints: [`${cap(o.audience)}${at} hat ein Problem („${p}“) und sucht eine Lösung.`, `Jemand bittet ChatGPT um Rat, weil gilt: ${lc(p)}.`] });
  if (o.alternatives?.length) g.push({ intent: 'Vergleich', angle: 'Unterschied zur Alternative konkret benennen', hints: [`${cap(o.audience)} vergleicht ${o.offer} mit der bisherigen Lösung („${o.alternatives.join('“, „')}“) und sucht Vor- und Nachteile.`, `Jemand will weg von „${o.alternatives[0]}“ und fragt, was ein Umstieg kostet und wie lange er dauert.`] });
  for (const occ of (o.occasions ?? []).slice(0, 3)) g.push({ intent: 'Anlass', angle: 'Anlass oder Zeitpunkt in den Titel', hints: [`${cap(o.audience)}${at} plant ${occ} und sucht dafür ${o.offer}.`] });
  g.push({ intent: 'Entscheidung', angle: 'Beleg oder Zahl statt Superlativ (Preis, Bewertung, Ergebnis)', hints: [`${cap(o.audience)} ist kurz vor der Entscheidung für ${o.offer} und fragt nach Preisen, Erfahrungen und Bedingungen.`] });
  return g;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// ---------------------------------------------------------------------------------------------
// Decision math: everything from stated assumptions; no hidden benchmarks, no auction model.
// ---------------------------------------------------------------------------------------------
export interface ScenarioInput { budget: number; cpc: [number, number, number]; cvr: [number, number, number]; valuePerConversion?: number; margin?: number; currentCostPerConversion?: number }
export interface Scenario { name: string; cpc: number; clicks: number; cvr: number; conversions: number; cpa: number; roas?: number }

export function scenarios(i: ScenarioInput): Scenario[] {
  const names = ['vorsichtig', 'Basis', 'optimistisch'];
  return [0, 1, 2].map((k) => {
    const cpc = i.cpc[2 - k] as number, cvr = i.cvr[k] as number;
    const clicks = Math.floor(i.budget / cpc), conversions = Math.round(clicks * cvr * 10) / 10;
    return { name: names[k] as string, cpc, clicks, cvr, conversions, cpa: conversions ? Math.round(i.budget / conversions) : Infinity,
      ...(i.valuePerConversion ? { roas: Math.round(((conversions * i.valuePerConversion) / i.budget) * 100) / 100 } : {}) };
  });
}

/** Highest cost per conversion that still pays off, and the matching maximum CPC per conversion-rate assumption. */
export function breakEven(i: ScenarioInput): { maxCpa: number; basis: string; maxCpc: [number, number, number] } | undefined {
  let maxCpa: number | undefined, basis = '';
  if (i.currentCostPerConversion) { maxCpa = i.currentCostPerConversion; basis = 'heutige Kosten je Abschluss im bestehenden Kanal (z. B. Provision)'; }
  else if (i.valuePerConversion) { maxCpa = i.valuePerConversion * (i.margin ?? 1); basis = i.margin ? `Wert je Abschluss × Marge ${Math.round(i.margin * 100)} %` : 'Wert je Abschluss (ohne Marge)'; }
  if (!maxCpa) return undefined;
  const m = maxCpa;
  return { maxCpa: Math.round(m), basis, maxCpc: i.cvr.map((c) => Math.round(m * c * 100) / 100) as [number, number, number] };
}

/** Observations per variant to detect p1 vs p2 (two-sided alpha 0.05, power 0.8). */
export function sampleSize(p1: number, p2: number): number {
  const z = 1.959964 + 0.841621;
  return Math.ceil((z * z * (p1 * (1 - p1) + p2 * (1 - p2))) / ((p1 - p2) ** 2));
}

/** What a budget can and cannot answer. */
export function testability(i: ScenarioInput, baseCtr = 0.01): string[] {
  const clicks = Math.floor(i.budget / i.cpc[1]);
  const nCtr = sampleSize(baseCtr, baseCtr * 1.5), nCvr = sampleSize(i.cvr[1], i.cvr[1] * 1.5);
  const out = [`Mit ${i.budget.toLocaleString('de-DE')} € und ca. ${i.cpc[1].toLocaleString('de-DE')} € pro Klick: rund ${clicks.toLocaleString('de-DE')} Klicks.`];
  out.push(clicks >= nCvr * 2
    ? `Reicht für einen Vergleich zweier Varianten auf Abschlüsse (+50 % Unterschied braucht ca. ${nCvr.toLocaleString('de-DE')} Klicks je Variante).`
    : `Reicht nicht für einen Vergleich auf Abschlüsse (dafür ca. ${nCvr.toLocaleString('de-DE')} Klicks je Variante). Prüfbar sind: wird ausgeliefert, wird geklickt, passt die Seite.`);
  out.push(`Klickraten lassen sich eher vergleichen: +50 % bei ${(baseCtr * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} % Klickrate braucht ca. ${nCtr.toLocaleString('de-DE')} Einblendungen je Variante.`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Diagnosis after launch from the numbers the Ads Manager shows (heuristic thresholds, stated).
// ---------------------------------------------------------------------------------------------
export interface ResultRow { name: string; impressions: number; clicks: number; spend: number; conversions?: number }
export interface Diagnosis { name: string; ctr: number; cpc: number; cvr?: number; area: 'Daten' | 'Auslieferung' | 'Anzeige' | 'Zielseite/Tracking' | 'ok'; next: string }

export function diagnose(rows: ResultRow[], days = 14): Diagnosis[] {
  return rows.map((r) => {
    const ctr = r.impressions ? r.clicks / r.impressions : 0, cpc = r.clicks ? r.spend / r.clicks : 0;
    const cvr = r.conversions !== undefined && r.clicks ? r.conversions / r.clicks : undefined;
    const base = { name: r.name, ctr: round(ctr, 4), cpc: round(cpc, 2), ...(cvr !== undefined ? { cvr: round(cvr, 4) } : {}) };
    if (r.impressions < 300 * Math.max(1, days / 14)) return { ...base, area: 'Auslieferung' as const, next: 'Kaum Einblendungen: Hinweis-Sätze breiter und beschreibender formulieren, Richtlinien-Status und Gebot prüfen. Erst danach Texte testen.' };
    if (r.impressions < 1000) return { ...base, area: 'Daten' as const, next: 'Noch zu wenig Einblendungen für eine Aussage. Weiterlaufen lassen.' };
    if (ctr < 0.004) return { ...base, area: 'Anzeige' as const, next: 'Wird gezeigt, aber selten geklickt: anderen Blickwinkel testen (Problem, Anlass, Beleg) statt nur Wörter zu tauschen.' };
    if (r.conversions !== undefined && r.clicks >= 100 && (cvr ?? 0) < 0.005) return { ...base, area: 'Zielseite/Tracking' as const, next: 'Klicks ohne Abschlüsse: Erst Tracking prüfen (Pixel/Einwilligung, UTM in der eigenen Statistik), dann ob die Zielseite das Versprechen der Anzeige einlöst.' };
    if (r.conversions === undefined) return { ...base, area: 'Daten' as const, next: 'Ohne Abschlusszahlen nur Auslieferung und Klicks bewertbar. UTM-Parameter setzen und Abschlüsse aus der eigenen Statistik ergänzen.' };
    return { ...base, area: 'ok' as const, next: 'Kein auffälliges Problem. Gewinner-Blickwinkel behalten, nächste Variable testen.' };
  });
}
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Two-proportion z-test on CTR; "unentschieden" unless p < 0.05. */
export function compareCtr(a: ResultRow, b: ResultRow): { winner?: string; p: number } {
  const p1 = a.clicks / a.impressions, p2 = b.clicks / b.impressions, p = (a.clicks + b.clicks) / (a.impressions + b.impressions);
  const se = Math.sqrt(p * (1 - p) * (1 / a.impressions + 1 / b.impressions));
  if (!se) return { p: 1 };
  const z = Math.abs(p1 - p2) / se, pv = 2 * (1 - phi(z));
  return { ...(pv < 0.05 ? { winner: p1 > p2 ? a.name : b.name } : {}), p: round(pv, 4) };
}
function phi(z: number): number { // standard normal CDF (Abramowitz-Stegun 7.1.26)
  const t = 1 / (1 + 0.3275911 * z / Math.SQRT2), e = Math.exp(-(z * z) / 2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * e;
  return 0.5 * (1 + erf);
}
