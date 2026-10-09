import { describe, expect, it } from 'vitest';
import { consistency, lintAd, robotsAllows, scenarios } from '../../src/domain/adsready/check.js';

const good = { title: 'Software als Stadt sehen', copy: 'Lizenzen, Fristen und Risiken auf einen Blick', url: 'https://example.org/city', contextHints: ['Mittelständler sucht Überblick über eigene Software und Lizenzkosten'] };

describe('ChatGPT Ads readiness', () => {
  it('accepts a clean ad and flags limits, hype, policy and weak hints', () => {
    expect(lintAd(good)).toEqual([{ level: 'ok', code: 'ok', message: 'Keine Auffälligkeiten.' }]);
    const bad = lintAd({ title: 'X'.repeat(51), copy: 'Die BESTE Software, garantiert!!', url: 'http://example.org/', contextHints: ['software'] });
    const codes = bad.map((f) => f.code);
    expect(codes).toEqual(expect.arrayContaining(['title_too_long', 'unsupported_claim', 'shouting', 'url_http', 'url_homepage', 'hint_too_short']));
    expect(lintAd({ ...good, copy: 'Sportwetten mit Bonus für neue Kunden' }).some((f) => f.code === 'policy_disallowed')).toBe(true);
  });
  it('measures ad/landing consistency', () => {
    const c = consistency(good, 'Ihre Software als Stadt: Lizenzen, Kündigungsfristen und Risiken sehen.');
    expect(c.score).toBeGreaterThan(50);
    expect(c.missing).toContain('fristen');
  });
  it('reads robots.txt for OAI-AdsBot', () => {
    const r = 'User-agent: *\nDisallow: /\n\nUser-agent: OAI-AdsBot\nAllow: /city\nDisallow: /';
    expect(robotsAllows(r, 'OAI-AdsBot', '/city')).toBe(true);
    expect(robotsAllows(r, 'OAI-AdsBot', '/admin')).toBe(false);
    expect(robotsAllows(r, 'OAI-SearchBot', '/city')).toBe(false);
    expect(robotsAllows('', 'OAI-AdsBot', '/')).toBe(true);
  });
  it('computes scenarios only from stated assumptions', () => {
    const s = scenarios({ budget: 1000, cpc: [3, 5, 8], cvr: [0.02, 0.04, 0.08], valuePerConversion: 600 });
    expect(s.map((x) => x.clicks)).toEqual([125, 200, 333]);
    expect(s[0]!.conversions).toBe(2.5);
    expect(s[2]!.roas).toBeCloseTo(15.98, 1);
  });
});

describe('regressions', () => {
  it('keeps umlauts intact when comparing ad and landing page', () => {
    const c = consistency({ title: 'Kündigungsfristen', copy: 'Verträge prüfen', url: 'https://x.de/a', contextHints: [] }, 'Kündigungsfristen und Verträge prüfen');
    expect(c).toEqual({ score: 100, missing: [] });
  });
});
