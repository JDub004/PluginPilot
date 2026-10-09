import { buildCity } from './domain/softwarecity/build.js';
import { inventoryCsv, renderReport } from './domain/softwarecity/report.js';
import { CityInputSchema } from './domain/softwarecity/schema.js';
import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Env } from './config/env.js';
import { existsSync, readFileSync } from 'node:fs';
import { renderSite } from './site.js';
import { loadWidget } from './tools/widget.js';

const PLAYGROUND = loadWidget('playground.html');
// Standalone share view: the city widget plus a loader that reads the URL fragment.
const CITY_VIEW = loadWidget('city.html').replace('</body>', () => `<style>.report-btn{position:fixed;left:12px;bottom:12px;z-index:5;padding:8px 14px;background:#3dffa8;color:#04121a;font:600 11px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;box-shadow:0 0 18px rgba(61,255,168,.4)}</style><script>${loadWidget('city-view.js')}</script></body>`);

// Static brand assets (logo files) from web/public, whitelisted by name.
const ASSETS: Record<string, string> = {};
for (const f of ['surcharge-check.svg', 'surcharge-check-small.svg', 'software-stadt.svg']) {
  for (const rel of [`../web/public/${f}`, `../../web/public/${f}`]) {
    const u = new URL(rel, import.meta.url);
    if (existsSync(u)) { ASSETS[f] = readFileSync(u, 'utf8'); break; }
  }
}
const TEMPLATE_CSV = ['../web/public/', '../../web/public/'].map((d) => new URL(`${d}software-stadt-vorlage.csv`, import.meta.url)).filter((u) => existsSync(u)).map((u) => readFileSync(u, 'utf8'))[0] ?? '';
import { createServer, type PluginKind } from './mcp/server.js';

// One endpoint per plugin (each is listed separately in the plugin directory).
const ROUTES: Record<string, PluginKind> = { '/mcp': 'trauerfall', '/trauerfall/mcp': 'trauerfall', '/geburt/mcp': 'geburt', '/surcharge/mcp': 'surcharge', '/city/mcp': 'city', '/ads/mcp': 'ads' };


function readJson(req: IncomingMessage, limit: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tooLarge = () => Object.assign(new Error('payload too large'), { status: 413 });
    if (Number(req.headers['content-length'] ?? 0) > limit) {
      req.resume(); // drain without buffering so the 413 can still be written
      reject(tooLarge());
      return;
    }
    let size = 0;
    let rejected = false;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      if (rejected) return;
      size += c.length;
      if (size > limit) {
        rejected = true;
        chunks.length = 0;
        reject(tooLarge());
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (rejected) return;
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined);
      } catch {
        reject(Object.assign(new Error('invalid json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', ...(status === 413 ? { connection: 'close' } : {}) }).end(JSON.stringify(body));
}

// Stateless streamable HTTP: a fresh server and transport per request, no session state.
async function handleMcp(env: Env, kind: PluginKind, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
  const body = await readJson(req, env.MAX_BODY_BYTES);
  const server = createServer(kind, undefined, env.PUBLIC_BASE_URL);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

export function createApp(env: Env): Server {
  return createHttpServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    if (path === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && path === '/.well-known/openai-apps-challenge') {
      if (!env.OPENAI_APPS_CHALLENGE) return send(res, 404, { error: 'not configured' });
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(env.OPENAI_APPS_CHALLENGE);
      return;
    }
    if (req.method === 'GET' && path?.startsWith('/assets/')) {
      const svg = ASSETS[path.slice('/assets/'.length)];
      if (!svg) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' }).end(svg);
      return;
    }
    if (path === '/robots.txt' && req.method === 'GET') {
      // Explicitly allow OpenAI's ads review and search crawlers (needed for ChatGPT Ads landing-page validation).
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end('User-agent: OAI-AdsBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: *\nAllow: /\n');
      return;
    }
    const sitePage = req.method === 'GET' && path ? renderSite(path, env) : undefined;
    if (sitePage) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; img-src 'self'" }).end(sitePage);
      return;
    }
    if ((path === '/' || path === '/playground') && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'" }).end(PLAYGROUND);
      return;
    }
    if (path === '/city/vorlage.csv' && req.method === 'GET') {
      // UTF-8 BOM so Excel opens umlauts correctly.
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="software-stadt-vorlage.csv"' }).end('\uFEFF' + TEMPLATE_CSV);
      return;
    }
    if (path === '/city/view' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' blob:" }).end(CITY_VIEW);
      return;
    }
    if (path === '/city/api/build' && req.method === 'POST') {
      readJson(req, env.MAX_BODY_BYTES).then((body) => {
        const parsed = CityInputSchema.safeParse(body);
        if (!parsed.success) return send(res, 400, { error: 'Ungültige Stadt-Daten' });
        const today = new Date().toISOString().slice(0, 10);
        const city = buildCity(parsed.data, { today });
        send(res, 200, { city: { ...city, inventoryCsv: inventoryCsv(city) }, report: renderReport(city, { date: today }) });
      }).catch((err: { status?: number }) => { if (!res.headersSent) send(res, err.status ?? 400, { error: 'bad request' }); });
      return;
    }
    const kind = ROUTES[path ?? ''];
    if (kind) {
      handleMcp(env, kind, req, res).catch((err: { status?: number }) => {
        if (!res.headersSent) send(res, err.status ?? 500, { error: err.status ? 'bad request' : 'internal error' });
      });
      return;
    }
    send(res, 404, { error: 'not found' });
  });
}
