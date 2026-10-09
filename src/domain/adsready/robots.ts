// robots.txt evaluation following RFC 9309 (https://www.rfc-editor.org/rfc/rfc9309):
// - groups for the same user agent are merged; user-agent matching is case-insensitive on the product token
// - no matching group: the "*" groups apply; no group at all: everything is allowed
// - the longest matching rule wins; on a tie, allow wins; "*" matches any sequence, "$" anchors the end
// - /robots.txt itself is always allowed
// HTTP status handling (4xx = allow all, 5xx/unreachable = treat as disallow) lives in `robotsFromStatus`.

export interface Rule { allow: boolean; pattern: string; line: number }
export interface Decision { allowed: boolean; rule?: Rule; group: 'specific' | 'wildcard' | 'none' }

interface Group { agents: string[]; rules: Rule[] }

export function parseRobots(text: string): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  text.replace(/^﻿/, '').split(/\r\n|\r|\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'allow' || key === 'disallow') {
      lastWasAgent = false;
      if (!cur || value === '') return; // rules outside a group are ignored; empty disallow = no rule
      cur.rules.push({ allow: key === 'allow', pattern: value, line: i + 1 });
    } else lastWasAgent = false; // sitemap, crawl-delay etc. end the user-agent run
  });
  return groups;
}

const token = (ua: string) => ua.trim().split(/[\s/]/)[0]!.toLowerCase();

function toRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

export function robotsDecision(text: string, userAgent: string, pathAndQuery: string): Decision {
  if (pathAndQuery === '/robots.txt') return { allowed: true, group: 'none' };
  const groups = parseRobots(text);
  const me = token(userAgent);
  let rules = groups.filter((g) => g.agents.some((a) => a === me)).flatMap((g) => g.rules);
  let group: Decision['group'] = 'specific';
  if (!groups.some((g) => g.agents.includes(me))) {
    const wild = groups.filter((g) => g.agents.includes('*'));
    if (!wild.length) return { allowed: true, group: 'none' };
    rules = wild.flatMap((g) => g.rules); group = 'wildcard';
  }
  let best: Rule | undefined;
  for (const r of rules) {
    if (!toRegex(r.pattern).test(pathAndQuery)) continue;
    const len = r.pattern.replace(/\$$/, '').length;
    const bestLen = best ? best.pattern.replace(/\$$/, '').length : -1;
    if (!best || len > bestLen || (len === bestLen && r.allow && !best.allow)) best = r;
  }
  return best ? { allowed: best.allow, rule: best, group } : { allowed: true, group };
}

export type RobotsState = 'allowed' | 'blocked' | 'uncertain';
/** RFC 9309 §2.3.1: 4xx means "no robots.txt" (allow), 5xx or unreachable means assume complete disallow. */
export function robotsFromStatus(status: number | null, text: string, userAgent: string, path: string): { state: RobotsState; detail: string; rule?: Rule } {
  if (status === null || status >= 500) return { state: 'uncertain', detail: `robots.txt nicht abrufbar (${status ?? 'kein Abruf'}): Crawler behandeln das als vollständiges Verbot.` };
  if (status >= 400) return { state: 'allowed', detail: `Keine robots.txt (HTTP ${status}): alles erlaubt.` };
  const d = robotsDecision(text, userAgent, path);
  const which = d.group === 'specific' ? `eigene Gruppe für ${token(userAgent)}` : d.group === 'wildcard' ? 'Gruppe "*"' : 'keine passende Gruppe';
  return d.allowed
    ? { state: 'allowed', detail: d.rule ? `Erlaubt durch Zeile ${d.rule.line} (Allow: ${d.rule.pattern}, ${which}).` : `Erlaubt (${which}, keine passende Regel).`, ...(d.rule ? { rule: d.rule } : {}) }
    : { state: 'blocked', detail: `Gesperrt durch Zeile ${d.rule!.line} (Disallow: ${d.rule!.pattern}, ${which}).`, rule: d.rule! };
}
