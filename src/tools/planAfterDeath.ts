import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { track } from '../analytics/events.js';
import { InvalidSituationError, planAfterDeath } from '../domain/trauerfall/plan.js';
import { PlanSchema, SituationSchema, type Plan } from '../domain/trauerfall/schema.js';

export const TOOL_NAME = 'plan_after_death';
export const WIDGET_URI = 'ui://trauerfall-lotse/timeline-v1.html';

export const TOOL_DESCRIPTION = [
  'Use this when someone in Germany has just lost a person (death of a parent, partner, relative) and asks what they have to do now,',
  'which offices to inform, which documents are needed, or which deadlines apply (Todesfall, Trauerfall, Sterbefall, "was ist zu tun").',
  'Returns a personal, dated timeline: doctor and funeral home, registering the death at the Standesamt (3rd working day),',
  'Sterbevierteljahr pension advance (30 days), widow/orphan pension, health insurance for co-insured spouses, rental contract',
  '(1 month), estate disclaimer (Erbausschlagung, 6 weeks), inheritance-tax notice, banks, car, business, contracts.',
  'Ask gently for the date of death and only the yes/no facts that matter; unknown facts can be left out.',
  'Do not use for deaths outside German law, for funeral planning before a death, or to decide legal questions about the estate.',
].join(' ');

import { RESOURCE_MIME_TYPE, WIDGET_HTML } from './widget.js';

export function registerPlanAfterDeath(server: McpServer, now: () => string = () => new Date().toISOString().slice(0, 10)): void {
  server.registerResource('Trauerfall-Fahrplan', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET_HTML, _meta: { ui: { prefersBorder: true } } }],
  }));

  server.registerTool(
    TOOL_NAME,
    {
      title: 'Fahrplan nach einem Todesfall',
      description: TOOL_DESCRIPTION,
      inputSchema: SituationSchema.shape,
      outputSchema: PlanSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: WIDGET_URI }, 'openai/outputTemplate': WIDGET_URI },
    },
    async (input) => {
      const started = Date.now();
      try {
        const plan = planAfterDeath(SituationSchema.parse(input), now());
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, findingCount: plan.steps.length,
          errorCount: plan.steps.filter((s) => s.overdue).length });
        return { structuredContent: plan, content: [{ type: 'text' as const, text: summarise(plan) }] };
      } catch (err) {
        const invalid = err instanceof InvalidSituationError || err instanceof RangeError || (err instanceof Error && err.name === 'ZodError');
        track({ tool: TOOL_NAME, outcome: invalid ? 'invalid_input' : 'error', durationMs: Date.now() - started });
        return {
          isError: true,
          content: [{ type: 'text' as const, text: invalid
            ? `Angaben unvollständig oder ungültig: ${err instanceof Error ? err.message.slice(0, 300) : ''}. Bitte behutsam nachfragen.`
            : 'Interner Fehler. Bitte später erneut versuchen.' }],
        };
      }
    },
  );
}

export function summarise(p: Plan): string {
  const crit = p.steps.filter((s) => s.critical && s.dueDate).map((s) => `${s.title}: ${s.overdue ? 'abgelaufen' : 'bis'} ${s.dueDate}`);
  const next = p.nextDeadline ? `Nächste wichtige Frist: ${p.nextDeadline.title} bis ${p.nextDeadline.dueDate}. ` : '';
  return `${next}${p.steps.length} Schritte. Fristen: ${crit.join('; ')}. ${p.support} ${p.disclaimer}`;
}
