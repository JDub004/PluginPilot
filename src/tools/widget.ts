import { existsSync, readFileSync } from 'node:fs';

// MCP Apps UI MIME type (current OpenAI Apps SDK docs).
export const RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

/** Loads a widget from web/src. Works from src/tools (tsx) and dist/src/tools (compiled). */
export function loadWidget(file: string): string {
  for (const rel of [`../../web/src/${file}`, `../../../web/src/${file}`]) {
    if (existsSync(new URL(rel, import.meta.url))) return readFileSync(new URL(rel, import.meta.url), 'utf8');
  }
  throw new Error(`${file} not found`);
}

// Shared timeline widget (Trauerfall, Geburt).
export const WIDGET_HTML = loadWidget('timeline.html');
