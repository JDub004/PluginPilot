import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { track } from '../analytics/events.js';
import { buildCity } from '../domain/softwarecity/build.js';
import { CityInputSchema } from '../domain/softwarecity/schema.js';
import { loadWidget, RESOURCE_MIME_TYPE } from './widget.js';

export const TOOL_NAME = 'map_software_city';
export const WIDGET_URI = 'ui://software-stadt/city-v1.html';
const WIDGET = loadWidget('city.html');

export const TOOL_DESCRIPTION = [
  'Use this when someone wants an overview of the software their company uses: an interactive, Sims-style town map where departments are',
  'districts, each program (SaaS tool, ERP, spreadsheet) is a building sized by its users, and data flows are paths between buildings.',
  'Before calling, collect from the user the programs, the department that mainly uses each one, and if known: users, paid licences,',
  'monthly cost, owner, whether it is business-critical, whether it was approved by IT, and which other programs it sends data to.',
  'The tool finds "quests": overlapping tools, unused licences with savings, critical data in spreadsheets, programs without owner,',
  'shadow IT, data islands and unknown data targets. Do not use for source-code architecture, network diagrams or org charts.',
].join(' ');

const Any = z.record(z.string(), z.unknown());
export const CityOutputSchema = z.object({
  company: z.string(), districts: z.array(Any), buildings: z.array(Any), roads: z.array(Any), quests: z.array(Any),
  stats: z.object({ apps: z.number(), districts: z.number(), monthlyCostEur: z.number(), potentialSavingsEurYear: z.number(), healthScore: z.number() }),
  disclaimer: z.string(),
});

export function registerMapSoftwareCity(server: McpServer): void {
  server.registerResource('Software-Stadt', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET, _meta: { ui: { prefersBorder: false } } }],
  }));
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Software-Stadt bauen',
      description: TOOL_DESCRIPTION,
      inputSchema: CityInputSchema.shape,
      outputSchema: CityOutputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: WIDGET_URI }, 'openai/outputTemplate': WIDGET_URI },
    },
    async (input) => {
      const started = Date.now();
      try {
        const city = buildCity(CityInputSchema.parse(input));
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, findingCount: city.buildings.length, errorCount: city.quests.length });
        const top = city.quests.slice(0, 5).map((q) => `${q.severity}: ${q.title}${q.savingEurYear ? ` (spart ${q.savingEurYear} €/Jahr)` : ''}`).join('; ');
        const text = `Software-Stadt von ${city.company}: ${city.stats.apps} Programme in ${city.stats.districts} Vierteln, ${city.stats.monthlyCostEur} €/Monat, ` +
          `Stadt-Gesundheit ${city.stats.healthScore}/100, Sparpotenzial ${city.stats.potentialSavingsEurYear} €/Jahr. Wichtigste Aufgaben: ${top || 'keine'}. ${city.disclaimer}`;
        return { structuredContent: { ...city }, content: [{ type: 'text' as const, text }] };
      } catch (err) {
        track({ tool: TOOL_NAME, outcome: 'invalid_input', durationMs: Date.now() - started });
        return { isError: true, content: [{ type: 'text' as const, text: `Angaben ungültig: ${err instanceof Error ? err.message.slice(0, 300) : ''}. Bitte fehlende Programme oder Kategorien nachfragen.` }] };
      }
    },
  );
}
