import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { track } from '../analytics/events.js';
import { checkStatement, InvalidStatementError } from '../domain/nebenkosten/check.js';
import { CheckResultSchema, StatementSchema, type CheckResult } from '../domain/nebenkosten/schema.js';

export const TOOL_NAME = 'check_utility_statement';

export const TOOL_DESCRIPTION = [
  'Use this when a tenant in Germany wants to know whether their annual utility/service-charge statement',
  '(Nebenkostenabrechnung, Betriebskostenabrechnung, Heizkostenabrechnung) is correct, whether they have to pay',
  'the Nachzahlung, or whether they can object (Widerspruch).',
  'It runs deterministic legal checks: billing period and deadlines (§ 556 BGB), non-allocable items such as',
  'Verwaltung or Reparaturen (BetrKV), cable TV after 1 July 2024, allocation-key arithmetic, wrong living area,',
  'totals versus prepayments, heating consumption share (HeizkostenV) and the CO2 cost split (CO2KostAufG).',
  'Before calling, read the statement the user shared and pass every cost line with the amount charged to the tenant;',
  'add total cost and allocation units when printed, and the dates. Do not invent values that are not on the statement.',
  'Returns findings with legal basis, an estimated overcharge in EUR and the objection deadline.',
  'Do not use for commercial leases, for creating a statement as a landlord, or for general tenancy-law questions',
  'without a concrete statement.',
].join(' ');

export function registerCheckUtilityStatement(server: McpServer): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Nebenkostenabrechnung prüfen',
      description: TOOL_DESCRIPTION,
      inputSchema: StatementSchema.shape,
      outputSchema: CheckResultSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    },
    async (input) => {
      const started = Date.now();
      try {
        const result = checkStatement(StatementSchema.parse(input));
        track({
          tool: TOOL_NAME,
          outcome: 'success',
          durationMs: Date.now() - started,
          verdict: result.verdict,
          findingCount: result.findings.length,
          errorCount: result.findings.filter((f) => f.severity === 'error').length,
        });
        return { structuredContent: result, content: [{ type: 'text' as const, text: summarise(result) }] };
      } catch (err) {
        const invalid = err instanceof InvalidStatementError || (err instanceof Error && err.name === 'ZodError');
        track({ tool: TOOL_NAME, outcome: invalid ? 'invalid_input' : 'error', durationMs: Date.now() - started });
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: invalid
                ? `Eingabe unvollständig oder ungültig: ${err instanceof Error ? err.message.slice(0, 500) : ''}. Bitte fehlende Angaben beim Nutzer erfragen.`
                : 'Interner Fehler bei der Prüfung. Bitte später erneut versuchen.',
            },
          ],
        };
      }
    },
  );
}

export function summarise(r: CheckResult): string {
  const errors = r.findings.filter((f) => f.severity === 'error').length;
  const warnings = r.findings.filter((f) => f.severity === 'warning').length;
  const head =
    r.verdict === 'no_issues_found'
      ? 'Keine Fehler nach den geprüften Regeln gefunden.'
      : `${errors} Fehler, ${warnings} Hinweise. Geschätzte Überzahlung: ${r.estimatedOverchargeEur.toFixed(2)} €.`;
  const deadline = r.objectionDeadline ? ` Einwendungen bis ${r.objectionDeadline} schriftlich an den Vermieter.` : '';
  return `${head}${deadline} (Regelwerk ${r.rulesVersion}. ${r.disclaimer})`;
}
