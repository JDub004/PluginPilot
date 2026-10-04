import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { setAnalyticsSink } from '../../src/analytics/events.js';
import { loadEnv } from '../../src/config/env.js';
import { createApp } from '../../src/http.js';

let server: Server;
let url: URL;
const events: unknown[] = [];

beforeAll(async () => {
  setAnalyticsSink((e) => events.push(e));
  server = createApp(loadEnv({ MAX_BODY_BYTES: '4096' }));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  url = new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`);
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

async function client(): Promise<Client> {
  const c = new Client({ name: 'test', version: '0' });
  await c.connect(new StreamableHTTPClientTransport(url));
  return c;
}

describe('MCP over HTTP', () => {
  it('lists exactly one read-only tool', async () => {
    const c = await client();
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name)).toEqual(['check_utility_statement']);
    expect(tools[0]?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
    expect(tools[0]?.outputSchema).toBeDefined();
    await c.close();
  });

  it('returns structured findings', async () => {
    const c = await client();
    const res = await c.callTool({
      name: 'check_utility_statement',
      arguments: {
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        receivedDate: '2025-04-10',
        items: [
          { label: 'Grundsteuer', tenantShare: 180 },
          { label: 'Verwaltungskosten', tenantShare: 95 },
        ],
      },
    });
    const sc = res.structuredContent as { verdict: string; estimatedOverchargeEur: number; objectionDeadline: string };
    expect(sc.verdict).toBe('issues_found');
    expect(sc.estimatedOverchargeEur).toBe(95);
    expect(sc.objectionDeadline).toBe('2026-04-30');
    await c.close();
  });

  it('rejects invalid input without leaking internals', async () => {
    const c = await client();
    const res = await c.callTool({ name: 'check_utility_statement', arguments: { periodStart: 'gestern', items: [] } });
    expect(res.isError).toBe(true);
    await c.close();
  });

  it('logs analytics without statement content', () => {
    const serialized = JSON.stringify(events);
    expect(serialized).toContain('check_utility_statement');
    expect(serialized).not.toContain('Verwaltungskosten');
    expect(serialized).not.toContain('Grundsteuer');
  });

  it('rejects oversized bodies with 413', async () => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ pad: 'x'.repeat(10_000) }),
    });
    expect(r.status).toBe(413);
  });

  it('health and 404', async () => {
    expect((await fetch(new URL('/health', url))).status).toBe(200);
    expect((await fetch(new URL('/nope', url))).status).toBe(404);
  });
});
