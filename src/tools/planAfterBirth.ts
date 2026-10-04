import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { track } from '../analytics/events.js';
import { BirthSituationSchema, InvalidBirthSituationError, planAfterBirth } from '../domain/geburt/plan.js';
import { PlanSchema, type Plan } from '../domain/trauerfall/schema.js';
import { RESOURCE_MIME_TYPE, WIDGET_HTML } from './widget.js';

export const TOOL_NAME = 'plan_after_birth';
export const WIDGET_URI = 'ui://geburts-lotse/timeline-v1.html';

export const TOOL_DESCRIPTION = [
  'Use this when parents in Germany have just had a baby (or the birth is days or weeks ago) and ask which applications and',
  'registrations are due and by when: birth registration and certificates (Standesamt), health insurance for the baby,',
  'Mutterschaftsgeld, Elternzeit notice to the employer (7 weeks ahead), Elterngeld (only 3 months retroactive),',
  'Kindergeld (6 months retroactive), Unterhaltsvorschuss, Kinderzuschlag, paternity acknowledgement for unmarried parents, Kita registration.',
  'Returns a dated timeline with the next critical deadline. Ask only for the birth date and the yes/no facts that matter.',
  'Do not use before the birth, for calculating the amount of Elterngeld, or for countries other than Germany.',
].join(' ');

export function registerPlanAfterBirth(server: McpServer, now: () => string): void {
  server.registerResource('Geburts-Fahrplan', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET_HTML, _meta: { ui: { prefersBorder: true } } }],
  }));
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Fahrplan nach der Geburt',
      description: TOOL_DESCRIPTION,
      inputSchema: BirthSituationSchema.shape,
      outputSchema: PlanSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: WIDGET_URI }, 'openai/outputTemplate': WIDGET_URI },
    },
    async (input) => {
      const started = Date.now();
      try {
        const plan = planAfterBirth(BirthSituationSchema.parse(input), now());
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, findingCount: plan.steps.length });
        return { structuredContent: { ...plan }, content: [{ type: 'text' as const, text: summarise(plan) }] };
      } catch (err) {
        const invalid = err instanceof InvalidBirthSituationError || err instanceof RangeError || (err instanceof Error && err.name === 'ZodError');
        track({ tool: TOOL_NAME, outcome: invalid ? 'invalid_input' : 'error', durationMs: Date.now() - started });
        return {
          isError: true,
          content: [{ type: 'text' as const, text: invalid ? `Angaben ungültig: ${err instanceof Error ? err.message.slice(0, 300) : ''}` : 'Interner Fehler.' }],
        };
      }
    },
  );
}

function summarise(p: Plan): string {
  const crit = p.steps.filter((s) => s.critical && s.dueDate).map((s) => `${s.title}: ${s.overdue ? 'Frist vorbei' : 'bis'} ${s.dueDate}`);
  return `${p.nextDeadline ? `Als Nächstes wichtig: ${p.nextDeadline.title} bis ${p.nextDeadline.dueDate}. ` : ''}Fristen: ${crit.join('; ')}. ${p.disclaimer}`;
}
