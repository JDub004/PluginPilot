import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { track } from '../analytics/events.js';
import { compareCtr, diagnose } from '../domain/adsready/check.js';
import { checkReadiness } from '../domain/adsready/run.js';

export const CHECK_TOOL = 'check_chatgpt_ads_readiness';
export const DIAGNOSE_TOOL = 'diagnose_chatgpt_ads_results';

const text = (max: number) => z.string().trim().min(1).max(max);
const triple = z.tuple([z.number().positive().max(10_000), z.number().positive().max(10_000), z.number().positive().max(10_000)]);
const rate = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)]);

export const CheckInput = z.object({
  url: z.string().url().max(2000).describe('Landing page the ad would link to (the most specific page, not the homepage)'),
  ads: z.array(z.object({ title: text(120), copy: text(200) }).strict()).max(10).default([]).describe('Draft ads: title and description'),
  offering: z.object({
    offer: text(120).describe('What is advertised, in the advertiser\'s words, e.g. "Espressobohnen aus eigener Röstung"'),
    audience: text(120).describe('Who it is for, e.g. "jemand mit neuer Siebträgermaschine"'),
    problems: z.array(text(160)).max(3).default([]), occasions: z.array(text(160)).max(3).default([]), alternatives: z.array(text(80)).max(3).default([]),
    place: text(60).optional(),
  }).strict().optional().describe('Used to suggest descriptive context hints per user intent'),
  assumptions: z.object({
    budget: z.number().positive().max(10_000_000), cpc: triple.describe('Cost per click: low, middle, high (EUR). Not official; ask the user or use their own data'),
    cvr: rate.describe('Conversion rate per click: low, middle, high (0-1)'), valuePerConversion: z.number().positive().max(10_000_000).optional(),
    margin: z.number().min(0).max(1).optional(), currentCostPerConversion: z.number().positive().max(10_000_000).optional().describe('What a conversion costs today in an existing channel, e.g. a booking-platform commission'),
  }).strict().optional(),
  preparedBy: text(80).optional().describe('Agency or consultant preparing the report'),
}).strict();

const Row = z.object({ name: text(80), impressions: z.number().int().min(0).max(1e10), clicks: z.number().int().min(0).max(1e10), spend: z.number().min(0).max(1e10), conversions: z.number().min(0).max(1e10).optional() }).strict();
export const DiagnoseInput = z.object({ rows: z.array(Row).min(1).max(50).describe('One row per ad or ad group, numbers from Ads Manager'), days: z.number().int().min(1).max(365).default(14) }).strict();

export function registerAdsReadiness(server: McpServer, now: () => string): void {
  server.registerTool(CHECK_TOOL, {
    title: 'ChatGPT-Ads-Check',
    description: [
      'Use this before someone launches ChatGPT Ads (or asks "should we advertise in ChatGPT?"). Fetches the landing page once and checks whether',
      'OpenAI\'s ad-review crawler OAI-AdsBot can reach it (robots.txt per RFC 9309, bot walls such as Cloudflare challenges, login, too little text,',
      'homepage instead of a specific page), lints draft ads against OpenAI\'s published limits and ad policy (with sources), lists ad terms missing',
      'on the page, suggests descriptive context hints per user intent, and turns stated budget assumptions into scenarios, break-even and a test plan.',
      'Reachability is simulated (same user agent, different IP), never verified. It does not know or predict OpenAI\'s ranking.',
    ].join(' '),
    inputSchema: CheckInput.shape,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
  }, async (input) => {
    const started = Date.now();
    try {
      const i = CheckInput.parse(input);
      const r = await checkReadiness(i.url, { date: now(), ads: i.ads, ...(i.offering ? { offering: i.offering } : {}), ...(i.assumptions ? { assumptions: i.assumptions } : {}), ...(i.preparedBy ? { preparedBy: i.preparedBy } : {}) });
      track({ tool: CHECK_TOOL, outcome: 'success', durationMs: Date.now() - started, verdict: r.verdict, findingCount: r.blockers.length });
      const { markdown, ...structured } = r;
      return { structuredContent: { ...structured, report: markdown }, content: [{ type: 'text' as const, text: markdown }] };
    } catch (err) {
      track({ tool: CHECK_TOOL, outcome: 'invalid_input', durationMs: Date.now() - started });
      return { isError: true, content: [{ type: 'text' as const, text: `Check nicht möglich: ${err instanceof Error ? err.message.slice(0, 300) : ''}` }] };
    }
  });

  server.registerTool(DIAGNOSE_TOOL, {
    title: 'ChatGPT-Ads-Ergebnisse deuten',
    description: [
      'Use this after a ChatGPT Ads campaign has run: the user pastes impressions, clicks, spend and optionally conversions per ad or ad group from',
      'Ads Manager. Classifies each row as a delivery, ad, landing-page/tracking or data problem with the next test, and compares click-through rates',
      'with a significance test (no winner without p < 0.05). Heuristic thresholds, stated in the output.',
    ].join(' '),
    inputSchema: DiagnoseInput.shape,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  }, async (input) => {
    const i = DiagnoseInput.parse(input);
    const d = diagnose(i.rows, i.days);
    const sorted = [...i.rows].filter((r) => r.impressions > 0).sort((a, b) => b.impressions - a.impressions);
    const cmp = sorted.length >= 2 ? compareCtr(sorted[0]!, sorted[1]!) : undefined;
    track({ tool: DIAGNOSE_TOOL, outcome: 'success', durationMs: 0, findingCount: d.length });
    const lines = d.map((x) => `- ${x.name}: Klickrate ${(x.ctr * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} %, CPC ${x.cpc.toLocaleString('de-DE')} € → ${x.area}. ${x.next}`);
    if (cmp) lines.push(cmp.winner ? `- Klickraten-Vergleich ${sorted[0]!.name} vs. ${sorted[1]!.name}: ${cmp.winner} ist besser (p = ${cmp.p}).` : `- Klickraten-Vergleich ${sorted[0]!.name} vs. ${sorted[1]!.name}: noch kein belastbarer Unterschied (p = ${cmp.p}). Weiterlaufen lassen.`);
    lines.push('_Schwellen sind Faustregeln (z. B. unter 0,4 % Klickrate = Anzeigenproblem), keine OpenAI-Werte._');
    return { structuredContent: { diagnosis: d, ...(cmp ? { ctrComparison: cmp } : {}) }, content: [{ type: 'text' as const, text: lines.join('\n') }] };
  });
}
