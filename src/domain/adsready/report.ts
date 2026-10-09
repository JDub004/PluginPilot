// Two-reader report: a technical ticket (agency / IT) and one page for management. Starts with blockers, no scores.
import type { PageReport } from './analyze.js';
import { breakEven, CHECKED, contextHints, lintAd, missingTerms, scenarios, testability, type AdInput, type Finding, type HintGroup, type Offering, type ScenarioInput } from './check.js';

export interface ReadinessInput { page: PageReport; ads: AdInput[]; offering?: Offering; assumptions?: ScenarioInput; preparedBy?: string; date: string }
export interface Readiness {
  verdict: 'blockiert' | 'mit Hinweisen' | 'bereit (simuliert)';
  blockers: string[];
  page: { url: string; reachable: string; cdn?: string; lang?: string; words: number; findings: PageReport['findings'] };
  ads: { title: string; copy: string; findings: Finding[]; missingTerms: string[] }[];
  hints: HintGroup[];
  decision?: { scenarios: ReturnType<typeof scenarios>; breakEven?: ReturnType<typeof breakEven>; testability: string[] };
  markdown: string;
}

export function buildReadiness(i: ReadinessInput): Readiness {
  const ads = i.ads.map((a) => ({ title: a.title, copy: a.copy, findings: lintAd(a), missingTerms: missingTerms(a, i.page.text) }));
  const hints = i.offering ? contextHints(i.offering) : [];
  const decision = i.assumptions ? { scenarios: scenarios(i.assumptions), breakEven: breakEven(i.assumptions), testability: testability(i.assumptions) } : undefined;
  const blockers = [
    ...i.page.findings.filter((f) => f.status === 'block').map((f) => f.title),
    ...ads.flatMap((a) => a.findings.filter((f) => f.level === 'error').map((f) => `Anzeige "${a.title}": ${f.message}`)),
  ];
  const warns = i.page.findings.some((f) => f.status === 'warn') || ads.some((a) => a.findings.length || a.missingTerms.length);
  const verdict: Readiness['verdict'] = blockers.length ? 'blockiert' : warns ? 'mit Hinweisen' : 'bereit (simuliert)';
  const r = { verdict, blockers, page: { url: i.page.url, reachable: i.page.reachable, ...(i.page.cdn ? { cdn: i.page.cdn } : {}), ...(i.page.lang ? { lang: i.page.lang } : {}), words: i.page.words, findings: i.page.findings }, ads, hints, ...(decision ? { decision } : {}) };
  return { ...r, markdown: render(r, i) };
}

const eur = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`;
const num = (n: number, d = 2) => n.toLocaleString('de-DE', { maximumFractionDigits: d });
const ICON = { block: '⛔', warn: '⚠️', ok: '✅' } as const;

function render(r: Omit<Readiness, 'markdown'>, i: ReadinessInput): string {
  const L: string[] = [];
  L.push(`# ChatGPT-Ads-Check: ${r.page.url}`, '', `_Stand ${i.date}${i.preparedBy ? ` · erstellt von ${i.preparedBy}` : ''} · Regeln geprüft ${CHECKED}_`, '');
  L.push(`**Ergebnis: ${r.verdict}.**`, '');
  if (r.blockers.length) { L.push('**Das blockiert dich zuerst:**', ...r.blockers.map((b) => `- ${b}`), ''); }

  L.push('## Teil 1: Für die Geschäftsführung', '');
  L.push(`- Zielseite: ${r.page.reachable}${r.page.cdn ? ` (Schutz über ${r.page.cdn})` : ''}. ${r.blockers.length ? 'Vor dem Start muss die Technik die Punkte in Teil 2 beheben, sonst läuft Budget ins Leere.' : 'Keine harten Hindernisse gefunden.'}`);
  if (r.decision) {
    const d = r.decision, be = d.breakEven;
    L.push('', '| Szenario | Klickpreis | Klicks | Abschlussrate | Abschlüsse | Kosten je Abschluss |', '|---|---|---|---|---|---|');
    for (const s of d.scenarios) L.push(`| ${s.name} | ${num(s.cpc)} € | ${num(s.clicks, 0)} | ${num(s.cvr * 100, 1)} % | ${num(s.conversions, 1)} | ${Number.isFinite(s.cpa) ? eur(s.cpa) : '–'} |`);
    if (be) L.push('', `**Lohnt sich ab:** höchstens ${eur(be.maxCpa)} je Abschluss (${be.basis}). Das heißt: Klickpreis höchstens ${be.maxCpc.map((c) => `${num(c)} €`).join(' / ')} bei den angenommenen Abschlussraten.`);
    L.push('', ...d.testability.map((t) => `- ${t}`));
    L.push('', '_Alle Zahlen sind Annahmen, keine Prognose. Klickpreise für ChatGPT Ads sind nicht offiziell veröffentlicht._');
  }

  L.push('', '## Teil 2: Technik-Ticket (Agentur / IT)', '');
  for (const f of r.page.findings) { L.push(`${ICON[f.status]} **${f.title}**: ${f.detail}`); if (f.fix && f.status !== 'ok') L.push(`   → ${f.fix}`); }
  if (r.ads.length) {
    L.push('', '### Anzeigen', '');
    for (const a of r.ads) {
      L.push(`**${a.title}** / ${a.copy}`);
      if (!a.findings.length && !a.missingTerms.length) L.push('- ✅ keine Hinweise');
      for (const f of a.findings) L.push(`- ${f.level === 'error' ? '⛔' : '⚠️'} ${f.message}${f.source ? ` ([Quelle](${f.source}))` : ''}`);
      if (a.missingTerms.length) L.push(`- ⚠️ Auf der Zielseite fehlen: ${a.missingTerms.join(', ')}. Anzeige und Seite sollen dasselbe Angebot beschreiben.`);
      L.push('');
    }
  }
  if (r.hints.length) {
    L.push('### Kontext-Hinweise je Absicht (Vorschläge, bitte redigieren)', '');
    for (const g of r.hints) { L.push(`**${g.intent}** (Anzeigen-Blickwinkel: ${g.angle})`, ...g.hints.map((h) => `- ${h}`), ''); }
  }
  L.push('### Nach dem Start: so liest man die Zahlen', '- Kaum Einblendungen → Auslieferung: Hinweise breiter formulieren, Richtlinien-Status, Gebot.', '- Einblendungen, aber kaum Klicks → Anzeige: anderen Blickwinkel testen.', '- Klicks ohne Abschlüsse → erst Tracking (UTM, Einwilligung), dann Zielseite.', '');
  L.push('_Keine Aussage über OpenAIs Ranking: Gewichte und Auktion sind nicht öffentlich. "Erreichbar" ist simuliert (gleiche Kennung, andere IP); sicher ist nur ein Blick in die Server-Logs. Keine Rechtsberatung._');
  return L.join('\n');
}
