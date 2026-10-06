import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { track } from '../analytics/events.js';
import { buildCity } from '../domain/softwarecity/build.js';
import { importLedger, importTable, mergeApps } from '../domain/softwarecity/import.js';
import { compareCities, encodeShare, inventoryCsv, renderReport, shareSafe } from '../domain/softwarecity/report.js';
import { AppSchema, CityInputSchema } from '../domain/softwarecity/schema.js';
import { loadWidget, RESOURCE_MIME_TYPE } from './widget.js';

export const TOOL_NAME = 'map_software_city';
export const IMPORT_TOOL_NAME = 'import_software_list';

export const ToolInputSchema = CityInputSchema.extend({
  before: z.array(AppSchema).min(1).max(120).optional().describe('Earlier app list of the same company, for a before/after comparison'),
}).strict();

export const ImportInputSchema = z.object({
  table: z.string().max(200_000).optional().describe('Software list pasted from Excel/Google Sheets or a CSV file, including the header row'),
  ledger: z.string().max(500_000).optional().describe('Accounting or bank export (CSV) with booking text/payee, amount and date columns'),
}).strict();
export const WIDGET_URI = 'ui://software-stadt/city-v1.html';
const WIDGET = loadWidget('city.html');

export const TOOL_DESCRIPTION = [
  'Use this when someone wants an overview of the software their company uses: an interactive, Sims-style town map where departments are',
  'districts, each program (SaaS tool, ERP, spreadsheet) is a building sized by its users, and data flows are paths between buildings.',
  'Before calling, collect from the user the programs, the department that mainly uses each one, and if known: users, paid licences,',
  'monthly cost, contract end date and notice period, owner, whether it is business-critical, whether it was approved by IT, and which other programs it sends data to.',
  'The tool finds "quests": overlapping tools, unused licences with savings, critical data in spreadsheets, programs without owner,',
  'shadow IT, data islands, unknown data targets, key persons without deputy and notice periods ending within 90 days. Every quest has a ready-to-copy e-mail or checklist (action.draft). Building height grows with users and importance (1-5).',
  'Optionally also ask for: key persons per department with role and business contact data (people walk through the town and can be',
  'clicked), sites with their city (shown on a map; each site is its own town to jump into), and external partners such as suppliers,',
  'tax advisors, IT service providers or key customers with the own apps used to exchange data with them. Only enter business contact',
  'data people agreed to share. Do not use for source-code architecture, network diagrams or org charts.',
].join(' ');

const Any = z.record(z.string(), z.unknown());
export const CityOutputSchema = z.object({
  company: z.string(), districts: z.array(Any), buildings: z.array(Any), roads: z.array(Any), quests: z.array(Any), people: z.array(Any), sites: z.array(Any), partners: z.array(Any),
  report: z.string(), inventoryCsv: z.string(), shareUrl: z.string(), comparison: Any.optional(),
  stats: z.object({ apps: z.number(), districts: z.number(), monthlyCostEur: z.number(), potentialSavingsEurYear: z.number(), healthScore: z.number(), urgent: z.number(), deadlines: z.number() }),
  brand: z.object({ name: z.string(), color: z.string().optional() }).optional(),
  disclaimer: z.string(),
});

export function registerMapSoftwareCity(server: McpServer, baseUrl: string, now: () => string): void {
  server.registerResource('Software-Stadt', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET, _meta: { ui: { prefersBorder: false } } }],
  }));
  server.registerTool(
    TOOL_NAME,
    {
      title: 'Software-Stadt bauen',
      description: TOOL_DESCRIPTION,
      inputSchema: ToolInputSchema.shape,
      outputSchema: CityOutputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: WIDGET_URI }, 'openai/outputTemplate': WIDGET_URI },
    },
    async (input) => {
      const started = Date.now();
      try {
        const { before, ...cityInput } = ToolInputSchema.parse(input);
        const preparedBy = cityInput.preparedBy;
        const today = now();
        const city = buildCity(cityInput, { today });
        const comparison = before ? compareCities(buildCity({ company: cityInput.company, apps: before }, { today }), city) : undefined;
        const report = renderReport(city, { date: today, ...(preparedBy ? { preparedBy } : {}), ...(comparison ? { comparison } : {}) });
        const shareUrl = `${baseUrl.replace(/\/$/, '')}/city/view#d=${encodeShare(shareSafe(cityInput))}`;
        track({ tool: TOOL_NAME, outcome: 'success', durationMs: Date.now() - started, findingCount: city.buildings.length, errorCount: city.quests.length });
        const top = city.quests.slice(0, 5).map((q) => `${q.severity}: ${q.title}${q.savingEurYear ? ` (spart ${q.savingEurYear} €/Jahr)` : ''}`).join('; ');
        const delta = comparison ? ` Vergleich: Gesundheit ${comparison.healthBefore} → ${comparison.healthAfter}, ${comparison.solved.length} Aufgaben erledigt, ${comparison.added.length} neu.` : '';
        const text = `Software-Stadt von ${city.company}: ${city.stats.apps} Programme in ${city.stats.districts} Vierteln, ${city.stats.monthlyCostEur} €/Monat, ` +
          `${city.stats.urgent} dringende Risiken, ${city.stats.deadlines} Kündigungsfristen in den nächsten 90 Tagen, vermeidbare Kosten ca. ${city.stats.potentialSavingsEurYear} €/Jahr. Wichtigste Aufgaben: ${top || 'keine'}. ${city.disclaimer}${delta} Teilen-Link (Daten nur im Link, nichts gespeichert, ohne Kontaktdaten): ${shareUrl}`;
        return { structuredContent: { ...city, report, inventoryCsv: inventoryCsv(city), shareUrl, ...(comparison ? { comparison: { ...comparison } } : {}) }, content: [{ type: 'text' as const, text }] };
      } catch (err) {
        track({ tool: TOOL_NAME, outcome: 'invalid_input', durationMs: Date.now() - started });
        return { isError: true, content: [{ type: 'text' as const, text: `Angaben ungültig: ${err instanceof Error ? err.message.slice(0, 300) : ''}. Bitte fehlende Programme oder Kategorien nachfragen.` }] };
      }
    },
  );

  server.registerTool(
    IMPORT_TOOL_NAME,
    {
      title: 'Software-Liste importieren',
      description: [
        'Use this when the user pastes a software list from Excel/Google Sheets/CSV, or an accounting/bank export, to turn it into the app list',
        'for map_software_city. Recognises German and English headers and number formats, and detects ~40 common SaaS vendors in booking texts',
        '(average monthly cost). Returns apps plus warnings; confirm missing departments/users with the user, then call map_software_city.',
      ].join(' '),
      inputSchema: ImportInputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    },
    async (input) => {
      const { table, ledger } = ImportInputSchema.parse(input);
      if (!table && !ledger) return { isError: true, content: [{ type: 'text' as const, text: 'Bitte eine Tabelle (table) oder einen Buchhaltungs-Export (ledger) übergeben.' }] };
      const t = table ? importTable(table) : { apps: [], warnings: [] };
      const l = ledger ? importLedger(ledger) : { apps: [], warnings: [] };
      const apps = mergeApps(t.apps, l.apps);
      const warnings = [...t.warnings, ...l.warnings];
      track({ tool: IMPORT_TOOL_NAME, outcome: apps.length ? 'success' : 'invalid_input', durationMs: 0, findingCount: apps.length, errorCount: warnings.length });
      const text = `${apps.length} Programme erkannt: ${apps.map((a) => a.name).join(', ') || 'keine'}.${warnings.length ? ` Hinweise: ${warnings.join(' ')}` : ''}`;
      return { structuredContent: { apps, warnings }, content: [{ type: 'text' as const, text }] };
    },
  );
}
