import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RESOURCE_MIME_TYPE, loadWidget } from './widget.js';

export const DATEIRAD_HTML = loadWidget('dateirad.html').replace('/*CORE*/', () => loadWidget('dateirad-core.js'));
export const DATEIRAD_URI = 'ui://datei-rad/rad-v1.html';
const TOOLS = ['format', 'crop', 'rotate', 'size', 'compress', 'filter', 'pdf', 'save'] as const;

const Input = z.object({ tool: z.enum(TOOLS).optional().describe('Function to open first: format, crop, rotate, size, compress, filter, pdf, save') });

/** Opens the drag-and-drop file wheel. Files never reach the server: all conversion runs in the widget. */
export function registerDateiRad(server: McpServer, baseUrl: string): void {
  server.registerResource('Datei-Rad', DATEIRAD_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: DATEIRAD_URI, mimeType: RESOURCE_MIME_TYPE, text: DATEIRAD_HTML, _meta: { ui: { prefersBorder: false } } }],
  }));
  server.registerTool(
    'open_file_wheel',
    {
      title: 'Datei-Rad öffnen',
      description: 'Use this when the user wants to convert, crop, rotate, resize, compress, filter or combine files into a PDF (images: PNG, JPG, WebP, GIF, BMP; data: CSV, JSON, text). ' +
        'Opens a drag-and-drop wheel; files are processed only in the user\'s browser and are never uploaded. Do not ask the user to paste file contents into the chat.',
      inputSchema: Input.shape,
      outputSchema: { tool: z.string().optional(), webUrl: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { ui: { resourceUri: DATEIRAD_URI }, 'openai/outputTemplate': DATEIRAD_URI },
    },
    async (input) => {
      const { tool } = Input.parse(input);
      const webUrl = `${baseUrl.replace(/\/$/, '')}/rad`;
      return {
        structuredContent: { ...(tool ? { tool } : {}), webUrl },
        content: [{ type: 'text' as const, text: `Datei-Rad ist offen: Datei in die Mitte ziehen und im Rad eine Funktion wählen. Nichts wird hochgeladen. Falls Downloads im Chat blockiert sind: ${webUrl}` }],
      };
    },
  );
}
