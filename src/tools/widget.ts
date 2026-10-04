import { existsSync, readFileSync } from 'node:fs';

// MCP Apps UI MIME type (current OpenAI Apps SDK docs).
export const RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

// Shared timeline widget. Works from src/tools (tsx) and dist/src/tools (compiled).
export const WIDGET_HTML = (() => {
  for (const rel of ['../../web/src/timeline.html', '../../../web/src/timeline.html']) {
    if (existsSync(new URL(rel, import.meta.url))) return readFileSync(new URL(rel, import.meta.url), 'utf8');
  }
  throw new Error('timeline.html not found');
})();
