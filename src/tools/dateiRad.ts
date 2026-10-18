import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { RESOURCE_MIME_TYPE, loadWidget } from './widget.js';

export const DATEIRAD_HTML = loadWidget('dateirad.html').replace('/*CORE*/', () => loadWidget('dateirad-core.js'));

// PDF libraries served same-origin under /rad/vendor/ (loaded by the page on first PDF use).
const VENDOR_FILES: Record<string, string> = {
  'pdf-lib.min.js': 'pdf-lib/dist/pdf-lib.min.js',
  'pdf.min.mjs': 'pdfjs-dist/build/pdf.min.mjs',
  'pdf.worker.min.mjs': 'pdfjs-dist/build/pdf.worker.min.mjs',
};
const vendorCache: Record<string, string> = {};
export function vendorFile(name: string): string | undefined {
  const rel = VENDOR_FILES[name];
  if (!rel) return undefined;
  if (!(name in vendorCache)) {
    const u = ['../../node_modules/', '../../../node_modules/'].map((d) => new URL(d + rel, import.meta.url)).find((x) => existsSync(x));
    if (!u) return undefined;
    vendorCache[name] = readFileSync(u, 'utf8');
  }
  return vendorCache[name];
}
/** Widget HTML for ChatGPT: libraries come from our own origin. */
export function widgetHtml(baseUrl: string): string {
  const v = `${baseUrl.replace(/\/$/, '')}/rad/vendor/`;
  return DATEIRAD_HTML.replace('<script>/*VENDOR*/</script>', () => `<script>window.__VENDOR=${JSON.stringify(v)};</script>`);
}
export const DATEIRAD_URI = 'ui://datei-rad/rad-v1.html';
const TOOLS = ['format', 'crop', 'rotate', 'size', 'compress', 'filter', 'pdf', 'save'] as const;

const Input = z.object({ tool: z.enum(TOOLS).optional().describe('Function to open first: format, crop, rotate, size, compress, filter, pdf, save') });

/** Opens the drag-and-drop file wheel. Files never reach the server: all conversion runs in the widget. */
export function registerDateiRad(server: McpServer, baseUrl: string): void {
  server.registerResource('Datei-Rad', DATEIRAD_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: DATEIRAD_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml(baseUrl), _meta: { ui: { prefersBorder: false, csp: { resourceDomains: [new URL(baseUrl).origin], connectDomains: [] } }, 'openai/widgetCSP': { resource_domains: [new URL(baseUrl).origin], connect_domains: [] } } }],
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
