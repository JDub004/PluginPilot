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
  const today = new Date().toISOString().slice(0, 10);
  const death = new Date(Date.now() - 9 * 86_400_000).toISOString().slice(0, 10);

  it('lists the plan tool (with widget) and the letter tool, both read-only', async () => {
    const c = await client();
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['draft_letter', 'plan_after_death']);
    for (const t of tools) expect(t.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
    expect(tools.find((t) => t.name === 'plan_after_death')?._meta).toMatchObject({ ui: { resourceUri: 'ui://trauerfall-lotse/timeline-v1.html' } });
    await c.close();
  });

  it('serves the timeline widget as an MCP Apps resource', async () => {
    const c = await client();
    const res = await c.readResource({ uri: 'ui://trauerfall-lotse/timeline-v1.html' });
    const content = res.contents[0] as { mimeType: string; text: string };
    expect(content.mimeType).toBe('text/html;profile=mcp-app');
    expect(content.text).toContain('ui/notifications/tool-result');
    expect(content.text).not.toContain('innerHTML');
    await c.close();
  });

  it('returns a structured plan', async () => {
    const c = await client();
    const res = await c.callTool({
      name: 'plan_after_death',
      arguments: { dateOfDeath: death, survivingSpouse: true, deceasedReceivedPension: true, rentedApartment: true },
    });
    const sc = res.structuredContent as { steps: { id: string }[]; nextDeadline?: { id: string } };
    expect(sc.steps.map((s) => s.id)).toEqual(expect.arrayContaining(['standesamt', 'sterbevierteljahr', 'witwenrente', 'mietvertrag']));
    expect(sc.nextDeadline?.id).toBe('sterbevierteljahr');
    await c.close();
  });

  it('drafts a letter', async () => {
    const c = await client();
    const res = await c.callTool({ name: 'draft_letter', arguments: { type: 'rundfunk_abmeldung', dateOfDeath: death } });
    expect((res.structuredContent as { subject: string }).subject).toContain('Rundfunkbeitrag');
    await c.close();
  });

  it('rejects invalid input without leaking internals', async () => {
    const c = await client();
    const res = await c.callTool({ name: 'plan_after_death', arguments: { dateOfDeath: '2999-01-01' } });
    expect(res.isError).toBe(true);
    await c.close();
  });

  it('logs analytics without situation content', () => {
    const serialized = JSON.stringify(events);
    expect(serialized).toContain('plan_after_death');
    expect(serialized).not.toContain(death);
  });

  it('serves the Geburts-Lotse as a separate plugin on /geburt/mcp', async () => {
    const c = new Client({ name: 'test', version: '0' });
    await c.connect(new StreamableHTTPClientTransport(new URL('/geburt/mcp', url)));
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name)).toEqual(['plan_after_birth']);
    const res = await c.callTool({ name: 'plan_after_birth', arguments: { birthDate: death } });
    expect((res.structuredContent as { phaseSet: string }).phaseSet).toBe('geburt');
    await c.close();
  });

  it('serves Surcharge Check on /surcharge/mcp with widget and dispute letter', async () => {
    const c = new Client({ name: 'test', version: '0' });
    await c.connect(new StreamableHTTPClientTransport(new URL('/surcharge/mcp', url)));
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name)).toEqual(['check_freight_surcharges']);
    const res = await c.callTool({
      name: 'check_freight_surcharges',
      arguments: { carrier: 'Hapag-Lloyd', originCountry: 'CN', destinationCountry: 'DE', bookingDate: '2026-04-01', lines: [{ label: 'War Risk Surcharge', amountUsd: 3000, containerType: '40HC' }] },
    });
    const sc = res.structuredContent as { verdict: string; disputeLetter?: string };
    expect(sc.verdict).toBe('dispute_recommended');
    expect(sc.disputeLetter).toContain('Disputed amount: USD 3000.00');
    const w = await c.readResource({ uri: 'ui://surcharge-check/audit-v1.html' });
    expect((w.contents[0] as { mimeType: string }).mimeType).toBe('text/html;profile=mcp-app');
    await c.close();
  });

  it('rejects oversized bodies with 413', async () => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ pad: 'x'.repeat(10_000) }),
    });
    expect(r.status).toBe(413);
  });

  it('serves the browser test page on / and /playground', async () => {
    for (const p of ['/', '/playground']) {
      const r = await fetch(new URL(p, url));
      expect(r.status).toBe(200);
      expect(await r.text()).toContain('PluginPilot – Testseite');
    }
  });

  it('serves website, support, privacy, terms, imprint and the logo', async () => {
    for (const p of ['/surcharge', '/support', '/privacy', '/terms', '/imprint']) {
      const r = await fetch(new URL(p, url));
      expect(r.status, p).toBe(200);
      expect(await r.text(), p).toContain('<h1>');
    }
    const logo = await fetch(new URL('/assets/surcharge-check.svg', url));
    expect(logo.headers.get('content-type')).toBe('image/svg+xml');
    expect((await fetch(new URL('/assets/../package.json', url))).status).toBe(404);
  });

  it('domain verification route is 404 until the token is configured', async () => {
    expect((await fetch(new URL('/.well-known/openai-apps-challenge', url))).status).toBe(404);
  });

  it('health and 404', async () => {
    expect((await fetch(new URL('/health', url))).status).toBe(200);
    expect((await fetch(new URL('/nope', url))).status).toBe(404);
  });
});
