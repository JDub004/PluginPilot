// ChatGPT Ads readiness: deterministic checks against OpenAI's published ad specs and policies.
// Sources (retrieved 2026-10-09 via search; help pages block direct fetch):
//  - Bulk Upload Campaign Schema Checklist (help.openai.com/en/articles/20001218): title 16-24 recommended / 50 max,
//    copy 32-48 recommended / 100 max.
//  - Advertiser Guidance for Allowing OpenAI Web Crawlers (help.openai.com/en/articles/20001243): OAI-AdsBot must reach
//    the landing page; robots.txt, WAF, CAPTCHA, login, app-only destinations can block review.
//  - Ad policies (openai.com/policies/ad-policies): disallowed and restricted categories.
//  - Create Ad Groups (help.openai.com/en/articles/20001211): context hints are broad thematic signals, not exact keywords.
// Nothing here models OpenAI's ranking. Scores are our own heuristics.

export type Level = 'error' | 'warn' | 'ok';
export interface Finding { level: Level; code: string; message: string }

export const LIMITS = { title: { rec: [16, 24], max: 50 }, copy: { rec: [32, 48], max: 100 } } as const;

/** Policy areas that are disallowed or restricted at launch (simplified; check the live policy before submitting). */
const POLICY: [RegExp, string, 'disallowed' | 'restricted'][] = [
  [/\b(casino|wetten|gambling|poker|sportwetten|lotterie)\b/i, 'Glücksspiel', 'disallowed'],
  [/\b(dating|sex|erotik|porn)/i, 'Dating/Erwachseneninhalte', 'disallowed'],
  [/\b(cannabis|thc|psychedel|alkohol|wein|bier|vodka|whisky)\b/i, 'Alkohol/Drogen', 'disallowed'],
  [/\b(wahl|partei|politik|election|kandidat)/i, 'Politik', 'disallowed'],
  [/\b(stellenangebot|job|wohnung zu vermieten|immobilie zu verkaufen)\b/i, 'Jobs/Wohnungen', 'disallowed'],
  [/\b(kredit|darlehen|versicherung|anlage|krypto|trading|finanz)/i, 'Finanzdienstleistungen', 'restricted'],
  [/\b(arzt|therapie|medikament|heil|gesundheit|abnehmen|diät)/i, 'Gesundheit', 'restricted'],
  [/\b(anwalt|rechtsberatung|kanzlei)\b/i, 'Rechtsberatung', 'restricted'],
];
const HYPE = /\b(beste[rns]?|nr\.?\s?1|garantiert|100\s?%|revolution|unschlagbar|kostenlos\s+für\s+immer|sofort reich)\b/i;

export interface AdInput { title: string; copy: string; url: string; contextHints: string[] }

export function lintAd(ad: AdInput): Finding[] {
  const f: Finding[] = [];
  const len = (s: string) => [...s].length;
  for (const [k, v] of [['title', ad.title], ['copy', ad.copy]] as const) {
    const l = len(v), lim = LIMITS[k];
    if (!v.trim()) f.push({ level: 'error', code: `${k}_empty`, message: `${k === 'title' ? 'Titel' : 'Beschreibung'} fehlt.` });
    else if (l > lim.max) f.push({ level: 'error', code: `${k}_too_long`, message: `${k === 'title' ? 'Titel' : 'Beschreibung'} hat ${l} Zeichen, erlaubt sind ${lim.max}.` });
    else if (l < lim.rec[0] || l > lim.rec[1]) f.push({ level: 'warn', code: `${k}_length`, message: `${k === 'title' ? 'Titel' : 'Beschreibung'}: ${l} Zeichen, empfohlen ${lim.rec[0]}-${lim.rec[1]}.` });
  }
  const all = `${ad.title} ${ad.copy}`;
  if (HYPE.test(all)) f.push({ level: 'warn', code: 'unsupported_claim', message: 'Superlativ oder Versprechen ohne Beleg ("beste", "garantiert" …): Ablehnungsrisiko und meist schwächer als ein konkreter Nutzen.' });
  if (/(.)\1{3,}|!!|[A-ZÄÖÜ]{6,}/.test(all)) f.push({ level: 'warn', code: 'shouting', message: 'Großbuchstaben oder Satzzeichen-Ketten wirken wie Werbung von gestern.' });
  for (const [re, name, kind] of POLICY) if (re.test(`${all} ${ad.contextHints.join(' ')}`)) {
    f.push({ level: kind === 'disallowed' ? 'error' : 'warn', code: `policy_${kind}`, message: kind === 'disallowed' ? `Bereich "${name}" ist laut Ad-Richtlinie nicht erlaubt.` : `Bereich "${name}" ist nur für freigegebene Werbetreibende erlaubt (manuelle Prüfung).` });
  }
  try {
    const u = new URL(ad.url);
    if (u.protocol !== 'https:') f.push({ level: 'warn', code: 'url_http', message: 'Zielseite ohne HTTPS.' });
    if (u.pathname === '/' || u.pathname === '') f.push({ level: 'warn', code: 'url_homepage', message: 'Startseite als Ziel: OpenAI empfiehlt die passendste Unterseite (Produkt/Inhalt).' });
    if (/apps\.apple\.com|play\.google\.com/.test(u.hostname)) f.push({ level: 'warn', code: 'url_app_store', message: 'App-Store-Links sind schwer prüfbar; eine normale Webseite wird bevorzugt.' });
  } catch { f.push({ level: 'error', code: 'url_invalid', message: 'Zielseiten-URL ist ungültig.' }); }
  if (ad.contextHints.length === 0) f.push({ level: 'warn', code: 'hints_missing', message: 'Keine Kontext-Hinweise: beschreibe Situationen und Bedürfnisse, in denen das Angebot hilft.' });
  for (const h of ad.contextHints) {
    const words = h.trim().split(/\s+/).length;
    if (words < 4) f.push({ level: 'warn', code: 'hint_too_short', message: `Hinweis "${h}" ist ein Stichwort. OpenAI empfiehlt beschreibende Sätze statt Keywords.` });
  }
  return f.length ? f : [{ level: 'ok', code: 'ok', message: 'Keine Auffälligkeiten.' }];
}

const STOP = new Set('und oder der die das ein eine für mit von zu im in auf ist sind wird den dem des the and for with your you our ihr ihre sie wir'.split(' '));
const terms = (s: string) => new Set(s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));

/** Share of ad terms that also appear on the landing page (our heuristic for "ad and destination describe the same offering"). */
export function consistency(ad: AdInput, landingText: string): { score: number; missing: string[] } {
  const a = terms(`${ad.title} ${ad.copy}`), page = terms(landingText);
  const missing = [...a].filter((t) => !page.has(t));
  return { score: a.size ? Math.round(((a.size - missing.length) / a.size) * 100) : 0, missing };
}

/** robots.txt check for the user agents OpenAI names for ads review and search. Simplified group matching. */
export function robotsAllows(robots: string, agent: string, path: string): boolean {
  const groups: { agents: string[]; rules: [boolean, string][] }[] = [];
  let cur: { agents: string[]; rules: [boolean, string][] } | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue;
    const [k, ...rest] = line.split(':'); const v = rest.join(':').trim(); const key = (k ?? '').trim().toLowerCase();
    if (key === 'user-agent') { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); }
    else if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push([key === 'allow', v]);
  }
  const g = groups.find((x) => x.agents.includes(agent.toLowerCase())) ?? groups.find((x) => x.agents.includes('*'));
  if (!g) return true;
  let best: [boolean, string] | undefined;
  for (const r of g.rules) if (r[1] && path.startsWith(r[1]) && (!best || r[1].length > best[1].length || (r[1].length === best[1].length && r[0]))) best = r;
  return best ? best[0] : true;
}

export interface ScenarioInput { budget: number; cpc: [number, number, number]; cvr: [number, number, number]; valuePerConversion?: number }
export interface Scenario { name: string; cpc: number; clicks: number; cvr: number; conversions: number; cpa: number; roas?: number }

/** Transparent scenario math from stated assumptions. No hidden benchmarks, no auction model. */
export function scenarios(i: ScenarioInput): Scenario[] {
  const names = ['vorsichtig', 'Basis', 'optimistisch'];
  return [0, 1, 2].map((k) => {
    const cpc = i.cpc[2 - k] as number, cvr = i.cvr[k] as number; // cautious = high CPC, low CVR
    const clicks = Math.floor(i.budget / cpc), conversions = Math.round(clicks * cvr * 10) / 10;
    return { name: names[k] as string, cpc, clicks, cvr, conversions, cpa: conversions ? Math.round(i.budget / conversions) : Infinity,
      ...(i.valuePerConversion ? { roas: Math.round(((conversions * i.valuePerConversion) / i.budget) * 100) / 100 } : {}) };
  });
}
