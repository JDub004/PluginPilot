import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Env } from './config/env.js';
import { existsSync, readFileSync } from 'node:fs';
import { renderSite } from './site.js';
import { loadWidget } from './tools/widget.js';

const PLAYGROUND = loadWidget('playground.html');

// Static brand assets (logo files) from web/public, whitelisted by name.
const ASSETS: Record<string, string> = {};
for (const f of ['surcharge-check.svg', 'surcharge-check-small.svg']) {
  for (const rel of [`../web/public/${f}`, `../../web/public/${f}`]) {
    const u = new URL(rel, import.meta.url);
    if (existsSync(u)) { ASSETS[f] = readFileSync(u, 'utf8'); break; }
  }
}
import { createServer, type PluginKind } from './mcp/server.js';

// One endpoint per plugin (each is listed separately in the plugin directory).
const ROUTES: Record<string, PluginKind> = { '/mcp': 'trauerfall', '/trauerfall/mcp': 'trauerfall', '/geburt/mcp': 'geburt', '/surcharge/mcp': 'surcharge' };


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
  const server = createServer(kind);
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
    const sitePage = req.method === 'GET' && path ? renderSite(path, env) : undefined;
    if (sitePage) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; img-src 'self'" }).end(sitePage);
      return;
    }
    if ((path === '/' || path === '/playground') && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'" }).end(PLAYGROUND);
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
