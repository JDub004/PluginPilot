import { describe, expect, it } from 'vitest';
import { analyzePage, visibleText } from '../../src/domain/adsready/analyze.js';
import { breakEven, compareCtr, contextHints, diagnose, lintAd, missingTerms, sampleSize, scenarios, testability } from '../../src/domain/adsready/check.js';
import { isPublicIp, validateUrl } from '../../src/domain/adsready/fetch.js';
import type { FetchResult } from '../../src/domain/adsready/fetch.js';

const good = { title: 'Software als Stadt sehen', copy: 'Lizenzen, Fristen und Risiken auf einen Blick', contextHints: ['Mittelständler sucht Überblick über eigene Software und Lizenzkosten'] };

describe('ad linter', () => {
  it('accepts a clean ad and cites sources for limits, claims and policy', () => {
    expect(lintAd(good)).toEqual([]);
    const bad = lintAd({ title: 'X'.repeat(51), copy: 'Die BESTE Software, garantiert!!', contextHints: ['software'] });
    expect(bad.map((f) => f.code)).toEqual(expect.arrayContaining(['title_too_long', 'unsupported_claim', 'shouting', 'hint_keyword']));
    expect(bad.find((f) => f.code === 'title_too_long')?.source).toContain('help.openai.com');
    const pol = lintAd({ title: 'Sportwetten ohne Limit', copy: 'Bonus für neue Kunden sichern', contextHints: [] });
    expect(pol.find((f) => f.code === 'policy_disallowed')?.message).toContain('Glücksspiel');
    expect(lintAd({ title: 'Belege steuerkonform', copy: 'Export an den Steuerberater per Klick', contextHints: [] }).some((f) => f.code === 'policy_restricted')).toBe(true);
  });
});

describe('missing terms (list, no percentage)', () => {
  it('understands German compounds, stems and hyphens', () => {
    const page = 'Ihre Software als Stadt: Lizenzen, Kündigungsfristen und Risiken sehen. Lizenz-Chaos aufräumen.';
    expect(missingTerms(good, page)).toEqual(['blick']);
    expect(missingTerms({ title: 'Kündigungsfristen', copy: 'Verträge prüfen', contextHints: [] }, 'Kündigungsfristen und Verträge prüfen')).toEqual([]);
    expect(missingTerms({ title: 'Familienurlaub mit Kindern', copy: 'Kinderbetreuung und Wanderwege', contextHints: [] }, 'Wellness & Genuss in den Alpen')).toEqual(['familienurlaub', 'kindern', 'kinderbetreuung', 'wanderwege']);
  });
});

describe('context hints', () => {
  it('builds descriptive sentences per intent from the advertiser words', () => {
    const g = contextHints({ offer: 'Espressobohnen', audience: 'jemand mit neuer Siebträgermaschine', problems: ['der Espresso schmeckt zu sauer'], alternatives: ['Supermarkt-Bohnen'], occasions: ['ein Geschenk für Kaffeeliebhaber'] });
    expect(g.map((x) => x.intent)).toEqual(['Entdecken', 'Problem', 'Vergleich', 'Anlass', 'Entscheidung']);
    expect(g.flatMap((x) => x.hints).every((h) => h.split(' ').length >= 6)).toBe(true);
    expect(g[1]!.hints[0]).toContain('der Espresso schmeckt zu sauer');
  });
});

describe('decision math', () => {
  const i = { budget: 1000, cpc: [3, 5, 8] as [number, number, number], cvr: [0.01, 0.03, 0.06] as [number, number, number], valuePerConversion: 1200 };
  it('computes scenarios and break-even only from stated assumptions', () => {
    expect(scenarios(i).map((s) => s.clicks)).toEqual([125, 200, 333]);
    expect(breakEven({ ...i, currentCostPerConversion: 300 })).toEqual({ maxCpa: 300, basis: expect.stringContaining('Provision'), maxCpc: [3, 9, 18] });
    expect(breakEven({ ...i, margin: 0.25 })?.maxCpa).toBe(300);
  });
  it('knows standard sample sizes and says what a budget can answer', () => {
    expect(sampleSize(0.01, 0.015)).toBeGreaterThan(7600);
    expect(sampleSize(0.01, 0.015)).toBeLessThan(7900);
    expect(sampleSize(0.03, 0.045)).toBeGreaterThan(2400);
    expect(testability(i).join(' ')).toContain('Reicht nicht');
  });
});

describe('diagnosis after launch', () => {
  it('separates delivery, ad and landing-page problems', () => {
    const d = diagnose([
      { name: 'A', impressions: 120, clicks: 2, spend: 9 },
      { name: 'B', impressions: 5000, clicks: 10, spend: 40, conversions: 0 },
      { name: 'C', impressions: 5000, clicks: 150, spend: 600, conversions: 0 },
      { name: 'D', impressions: 5000, clicks: 150, spend: 600, conversions: 6 },
    ]);
    expect(d.map((x) => x.area)).toEqual(['Auslieferung', 'Anzeige', 'Zielseite/Tracking', 'ok']);
  });
  it('declares a CTR winner only with significance', () => {
    expect(compareCtr({ name: 'A', impressions: 1000, clicks: 10, spend: 0 }, { name: 'B', impressions: 1000, clicks: 13, spend: 0 }).winner).toBeUndefined();
    expect(compareCtr({ name: 'A', impressions: 20000, clicks: 200, spend: 0 }, { name: 'B', impressions: 20000, clicks: 300, spend: 0 }).winner).toBe('B');
  });
});

describe('safe fetch guard (SSRF)', () => {
  it('rejects internal targets and odd URLs', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1']) expect(isPublicIp(ip)).toBe(false);
    expect(isPublicIp('93.184.216.34')).toBe(true);
    for (const u of ['file:///etc/passwd', 'http://localhost/', 'http://127.0.0.1/', 'http://intranet/', 'https://a.b.local/', 'https://user:pw@example.org/', 'https://example.org:8443/']) expect(() => validateUrl(u)).toThrow();
    expect(validateUrl('https://example.org/city').hostname).toBe('example.org');
  });
});

const res = (o: Partial<FetchResult>): FetchResult => ({ url: 'https://shop.example/espresso', status: 200, headers: {}, body: '', redirects: [], ...o });
const page = `<html lang="de"><body>${'<p>Frisch geröstete Espressobohnen aus Leipzig für Siebträger. </p>'.repeat(20)}</body></html>`;

describe('landing-page analysis', () => {
  it('reports a Cloudflare bot wall with a fix, but never "verified"', () => {
    const r = analyzePage({ url: 'https://shop.example/', adsbot: res({ url: 'https://shop.example/', status: 403, headers: { 'cf-ray': 'x', server: 'cloudflare' }, body: '<title>Just a moment...</title>' }), browser: res({ url: 'https://shop.example/', body: page }), robots: res({ status: 404 }) });
    expect(r.reachable).toBe('blockiert');
    expect(r.cdn).toBe('Cloudflare');
    const wall = r.findings.find((f) => f.code === 'bot_wall')!;
    expect(wall.detail).toContain('Browser-Kennung lädt die Seite normal');
    expect(wall.fix).toContain('Bot Fight Mode nicht komplett abschalten');
    expect(r.findings.some((f) => f.code === 'homepage')).toBe(true);
  });
  it('labels a pass as simulated and flags robots, thin text and login', () => {
    const ok = analyzePage({ url: 'https://shop.example/espresso', adsbot: res({ body: page }), browser: res({ body: page }), robots: res({ body: 'User-agent: *\nAllow: /' }) });
    expect(ok.reachable).toBe('simuliert erreichbar');
    expect(ok.findings.find((f) => f.code === 'reachable_simulated')?.title).toContain('nicht verifiziert');
    expect(ok.lang).toBe('de');
    const blocked = analyzePage({ url: 'https://h.example/buchen', adsbot: res({ url: 'https://h.example/buchen', body: '<div id="app"></div><input type="password">' }), browser: res({}), robots: res({ body: 'User-agent: OAI-AdsBot\nDisallow: /buchen' }) });
    expect(blocked.findings.map((f) => f.code)).toEqual(expect.arrayContaining(['robots_blocked', 'login', 'thin_text']));
  });
  it('extracts visible text only', () => {
    expect(visibleText('<style>a{}</style><script>x=1</script><p>Hallo &amp; Tschüss</p>')).toBe('Hallo & Tschüss');
  });
});

describe('regressions: bot-wall false positives', () => {
  it('does not flag a normal page that merely mentions CAPTCHA products', () => {
    const product = `<html lang="de"><body>${'<p>Turnstile ersetzt CAPTCHA, Access denied war gestern. Bot-Schutz für Ihre Website. </p>'.repeat(30)}</body></html>`;
    const r = analyzePage({ url: 'https://vendor.example/plans', adsbot: res({ url: 'https://vendor.example/plans', body: product }), browser: res({ url: 'https://vendor.example/plans', body: product }), robots: res({ status: 404 }) });
    expect(r.reachable).toBe('simuliert erreichbar');
  });
  it('still flags a 200 interstitial with little text', () => {
    const r = analyzePage({ url: 'https://shop.example/x', adsbot: res({ url: 'https://shop.example/x', body: '<html><head><title>Just a moment...</title></head><body><div id="cf-chl-widget"></div></body></html>' }), browser: res({ body: page }), robots: res({ status: 404 }) });
    expect(r.reachable).toBe('blockiert');
  });
});

describe('abuse and load limits', async () => {
  const { SlidingWindow, Semaphore, TtlCache } = await import('../../src/domain/adsready/limits.js');
  it('limits checks per target host within a window', () => {
    let t = 0; const w = new SlidingWindow(2, 60_000, () => t);
    expect([w.take('a.de'), w.take('a.de'), w.take('a.de'), w.take('b.de')]).toEqual([true, true, false, true]);
    t = 61_000; expect(w.take('a.de')).toBe(true);
  });
  it('caps concurrency and expires cache entries', () => {
    const s = new Semaphore(1); expect([s.tryAcquire(), s.tryAcquire()]).toEqual([true, false]); s.release(); expect(s.tryAcquire()).toBe(true);
    let t = 0; const c = new TtlCache<number>(1000, 2, () => t);
    c.set('x', 1); c.set('y', 2); c.set('z', 3);
    expect([c.get('x'), c.get('y')]).toEqual([undefined, 2]);
    t = 2000; expect(c.get('y')).toBeUndefined();
  });
});
