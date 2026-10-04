import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { track } from '../analytics/events.js';
import { parseIso } from '../domain/trauerfall/calendar.js';
import { draftLetter, LETTER_TYPES } from '../domain/trauerfall/letters.js';

export const TOOL_NAME = 'draft_letter';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = (max: number) => z.string().trim().min(1).max(max);

export const LetterInputSchema = z
  .object({
    type: z.enum(LETTER_TYPES).describe('Which letter. Use the letterType from a plan_after_death step.'),
    dateOfDeath: isoDate,
    deceasedName: text(120).optional(),
    senderName: text(120).optional(),
    senderAddress: text(300).optional(),
    recipient: text(300).optional(),
    reference: text(80).optional().describe('Contract, customer, contribution or insurance number'),
    relationship: text(60).optional(),
    contractName: text(120).optional().describe('For vertrag_kuendigung: e.g. "Mobilfunkvertrag"'),
  })
  .strict();

export const LetterOutputSchema = z.object({
  type: z.string(),
  subject: z.string(),
  recipientHint: z.string(),
  body: z.string(),
  attachments: z.array(z.string()),
  sendHint: z.string(),
  computed: z.object({ label: z.string(), date: z.string() }).optional(),
});

export function registerDraftLetter(server: McpServer, now: () => string): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Brief nach einem Todesfall vorbereiten',
      description:
        'Use this after plan_after_death when the user wants a ready-to-send letter for one of the steps: terminating the deceased\'s rental ' +
        'contract as heir (§ 564 BGB, computes the end date), declaring not to continue a shared tenancy (§ 563 BGB), cancelling contracts, ' +
        'Rundfunkbeitrag, informing the bank or employer, joining voluntary health insurance (§ 9 SGB V), or handing in a will (§ 2259 BGB). ' +
        'Names and addresses are optional; missing ones stay as [placeholders] the user fills in. Do not use for disclaiming an inheritance ' +
        '(that must be done at the probate court or a notary) or for letters unrelated to a death.',
      inputSchema: LetterInputSchema.shape,
      outputSchema: LetterOutputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    },
    async (input) => {
      const started = Date.now();
      try {
        const args = LetterInputSchema.parse(input);
        parseIso(args.dateOfDeath);
        const letter = draftLetter({ ...args, today: now() });
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, verdict: args.type });
        return { structuredContent: { ...letter }, content: [{ type: 'text' as const, text: `${letter.subject}\n\n${letter.body}\n\nHinweis: ${letter.sendHint}` }] };
      } catch (err) {
        track({ tool: TOOL_NAME, outcome: 'invalid_input', durationMs: Date.now() - started });
        return { isError: true, content: [{ type: 'text' as const, text: `Angaben ungültig: ${err instanceof Error ? err.message.slice(0, 300) : ''}` }] };
      }
    },
  );
}
