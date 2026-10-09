import { describe, expect, it } from 'vitest';
import { robotsDecision, robotsFromStatus } from '../../src/domain/adsready/robots.js';

const A = 'OAI-AdsBot/1.0';
const allowed = (txt: string, path: string, ua = A) => robotsDecision(txt, ua, path).allowed;

describe('robots.txt per RFC 9309 (public test cases)', () => {
  it('prefers the specific group over *, with wildcards and $', () => {
    const r = 'User-agent: *\nDisallow: /\n\nUser-agent: OAI-AdsBot\nAllow: /gartenmoebel/$\nDisallow: /*?';
    expect(allowed(r, '/gartenmoebel/')).toBe(true);
    expect(allowed(r, '/gartenmoebel/?farbe=grau')).toBe(false);
    expect(allowed(r, '/gartenmoebel/tisch')).toBe(true); // no rule matches -> allowed
    expect(allowed(r, '/x', 'OAI-SearchBot')).toBe(false); // falls back to *
  });
  it('matches user agents case-insensitively by product token', () => {
    expect(allowed('User-agent: oai-adsbot\nDisallow: /', '/a')).toBe(false);
    expect(allowed('User-agent: OAI-AdsBotX\nDisallow: /', '/a')).toBe(true);
  });
  it('merges separate groups for the same agent (plugins append blocks)', () => {
    const r = 'User-agent: OAI-AdsBot\nAllow: /shop\n\nUser-agent: Googlebot\nDisallow: /\n\nUser-agent: OAI-AdsBot\nDisallow: /shop/checkout';
    expect(allowed(r, '/shop/kaffee')).toBe(true);
    expect(allowed(r, '/shop/checkout')).toBe(false);
  });
  it('lets the longest rule win and allow win ties', () => {
    expect(allowed('User-agent: *\nDisallow: /a\nAllow: /a/b', '/a/b/c')).toBe(true);
    expect(allowed('User-agent: *\nAllow: /a/b\nDisallow: /a/b/', '/a/b/c')).toBe(false);
    expect(allowed('User-agent: *\nDisallow: /page\nAllow: /page', '/page')).toBe(true);
  });
  it('handles grouped user-agent lines, empty disallow, comments and robots.txt itself', () => {
    expect(allowed('User-agent: GPTBot\nUser-agent: OAI-AdsBot\nDisallow: /intern # privat', '/intern/x')).toBe(false);
    expect(allowed('User-agent: *\nDisallow:', '/alles')).toBe(true);
    expect(allowed('User-agent: *\nDisallow: /', '/robots.txt')).toBe(true);
    expect(allowed('', '/a')).toBe(true);
  });
  it('maps HTTP status like RFC 9309: 4xx allow all, 5xx uncertain', () => {
    expect(robotsFromStatus(404, '', A, '/').state).toBe('allowed');
    expect(robotsFromStatus(503, '', A, '/').state).toBe('uncertain');
    expect(robotsFromStatus(null, '', A, '/').state).toBe('uncertain');
    const b = robotsFromStatus(200, 'User-agent: *\nDisallow: /', A, '/city');
    expect(b.state).toBe('blocked');
    expect(b.detail).toContain('Zeile 2');
  });
});
