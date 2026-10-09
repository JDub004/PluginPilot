// Safe page fetch for user-supplied URLs (SSRF guard): http(s) on ports 80/443 only, every DNS answer must be a public
// address (checked inside the socket lookup, so the connection uses the validated IP), manual redirects (max 3, each
// re-validated), 10 s timeout, 1.5 MB body cap.
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';

export const ADSBOT_UA = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot)';
export const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const MAX_BYTES = 1_500_000;

export function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number) as [number, number];
    return !(a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224);
  }
  if (isIP(ip) === 6) {
    const s = ip.toLowerCase();
    if (s.startsWith('::ffff:')) return isPublicIp(s.slice(7));
    return !(s === '::' || s === '::1' || s.startsWith('fc') || s.startsWith('fd') || s.startsWith('fe8') || s.startsWith('fe9') || s.startsWith('fea') || s.startsWith('feb') || s.startsWith('ff') || s.startsWith('64:ff9b') || s.startsWith('2001:db8'));
  }
  return false;
}

export function validateUrl(raw: string): URL {
  const u = new URL(raw);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Nur http(s)-Adressen sind erlaubt.');
  if (u.username || u.password) throw new Error('Adressen mit Zugangsdaten sind nicht erlaubt.');
  if (u.port && u.port !== '80' && u.port !== '443') throw new Error('Nur die Standard-Ports 80 und 443 sind erlaubt.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !isPublicIp(host)) throw new Error('Interne Adressen sind nicht erlaubt.');
  if (!isIP(host) && (!host.includes('.') || /\.(local|internal|localhost|lan|home|corp)$/i.test(host) || /^localhost$/i.test(host))) throw new Error('Nur öffentliche Domains sind erlaubt.');
  return u;
}

function safeLookup(hostname: string, options: object, cb: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void): void {
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err, '', 0);
    const list = addresses as LookupAddress[];
    const bad = list.find((a) => !isPublicIp(a.address));
    if (bad || !list.length) return cb(Object.assign(new Error('Domain zeigt auf eine interne Adresse.'), { code: 'EBLOCKED' }), '', 0);
    if ((options as { all?: boolean }).all) return cb(null, list);
    cb(null, list[0]!.address, list[0]!.family);
  });
}

export interface FetchResult { url: string; status: number | null; headers: Record<string, string>; body: string; redirects: string[]; error?: string }

function once(u: URL, ua: string): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(u, { method: 'GET', headers: { 'user-agent': ua, accept: 'text/html,text/plain;q=0.9,*/*;q=0.5', 'accept-language': 'de,en;q=0.8' }, lookup: safeLookup as never, timeout: 10_000 }, (res) => {
      const chunks: Buffer[] = []; let size = 0;
      res.on('data', (c: Buffer) => { size += c.length; if (size > MAX_BYTES) { req.destroy(); return; } chunks.push(c); });
      res.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
        resolve({ status: res.statusCode ?? 0, headers, body: Buffer.concat(chunks).toString('utf8') });
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Zeitüberschreitung nach 10 Sekunden.')));
    req.on('error', reject);
    req.end();
  });
}

export async function safeFetch(raw: string, ua: string): Promise<FetchResult> {
  let u: URL;
  try { u = validateUrl(raw); } catch (e) { return { url: raw, status: null, headers: {}, body: '', redirects: [], error: (e as Error).message }; }
  const redirects: string[] = [];
  for (let hop = 0; hop <= 3; hop++) {
    try {
      const r = await once(u, ua);
      if (r.status >= 300 && r.status < 400 && r.headers.location) {
        const next = new URL(r.headers.location, u);
        redirects.push(next.toString());
        u = validateUrl(next.toString());
        continue;
      }
      return { url: u.toString(), status: r.status, headers: r.headers, body: r.body, redirects };
    } catch (e) { return { url: u.toString(), status: null, headers: {}, body: '', redirects, error: (e as Error).message }; }
  }
  return { url: u.toString(), status: null, headers: {}, body: '', redirects, error: 'Zu viele Weiterleitungen.' };
}
