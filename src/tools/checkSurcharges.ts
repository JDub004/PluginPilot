import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { track } from '../analytics/events.js';
import { AuditInputSchema, auditSurcharges } from '../domain/surcharge/audit.js';
import { disputeLetter } from '../domain/surcharge/letter.js';
import { loadWidget, RESOURCE_MIME_TYPE } from './widget.js';

export const TOOL_NAME = 'check_freight_surcharges';
export const WIDGET_URI = 'ui://surcharge-check/audit-v1.html';
const WIDGET = loadWidget('surcharge.html');

export const TOOL_DESCRIPTION = [
  'Use this when a shipper, importer, exporter or e-commerce seller wants to know whether the surcharges on an ocean freight quote or invoice',
  'are legitimate, especially war risk, emergency conflict/contingency, emergency bunker/fuel and operational cost recovery surcharges',
  'added since the 2026 Middle East / Strait of Hormuz crisis. Extract each charge line (label, USD amount, container type, quantity),',
  'the carrier, origin and destination country (ISO codes), booking date and sailing date. The tool checks each line against a curated database',
  'of carrier announcements (scope, amount, effective date, cargo-in-transit rule, later dates for US FMC-regulated trades), flags duplicates',
  'and all-in-rate conflicts, returns the disputable amount and drafts a dispute letter.',
  'Do not use for air freight, parcel shipping, customs duties, or to get new freight quotes.',
].join(' ');

const LineOut = z.object({
  label: z.string(), code: z.string(), status: z.enum(['ok', 'check', 'flag']), charged: z.number(), expected: z.number().optional(),
  overchargeUsd: z.number(), findings: z.array(z.string()), announcementId: z.string().optional(), source: z.string().optional(),
  sourceConfidence: z.enum(['primary', 'secondary']).optional(),
});
export const AuditOutputSchema = z.object({
  dbVersion: z.string(), carrierKnown: z.boolean(), usRegulatedTrade: z.boolean(), totalCharged: z.number(), totalOverchargeUsd: z.number(),
  verdict: z.enum(['dispute_recommended', 'clarify', 'no_issues_found']), lines: z.array(LineOut), nextSteps: z.array(z.string()),
  disclaimer: z.string(), disputeLetter: z.string().optional(),
});

export function registerCheckSurcharges(server: McpServer, now: () => string): void {
  server.registerResource('Surcharge Check', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET, _meta: { ui: { prefersBorder: true } } }],
  }));
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Check freight surcharges',
      description: TOOL_DESCRIPTION,
      inputSchema: AuditInputSchema.shape,
      outputSchema: AuditOutputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: WIDGET_URI }, 'openai/outputTemplate': WIDGET_URI },
    },
    async (input) => {
      const started = Date.now();
      try {
        const args = AuditInputSchema.parse(input);
        const result = auditSurcharges(args);
        const letter = disputeLetter(args, result, now());
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, verdict: result.verdict, findingCount: result.lines.length,
          errorCount: result.lines.filter((l) => l.status === 'flag').length });
        const text = `${result.verdict}: disputable USD ${result.totalOverchargeUsd.toFixed(2)} of USD ${result.totalCharged.toFixed(2)} checked. ` +
          result.lines.map((l) => `${l.label} [${l.status}]: ${l.findings.join(' ')}`).join(' | ') + ` ${result.disclaimer}`;
        return { structuredContent: { ...result, ...(letter ? { disputeLetter: letter } : {}) }, content: [{ type: 'text' as const, text }] };
      } catch (err) {
        track({ tool: TOOL_NAME, outcome: 'invalid_input', durationMs: Date.now() - started });
        return { isError: true, content: [{ type: 'text' as const, text: `Invalid input: ${err instanceof Error ? err.message.slice(0, 300) : ''}. Ask the user for the missing details.` }] };
      }
    },
  );
}
