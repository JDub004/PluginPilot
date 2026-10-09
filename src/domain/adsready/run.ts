// Orchestration: fetch robots.txt, the page as OAI-AdsBot and as a browser, then analyse. The only module with network.
import { analyzePage } from './analyze.js';
import { ADSBOT_UA, BROWSER_UA, safeFetch, validateUrl } from './fetch.js';
import { LimitError, Semaphore, SlidingWindow, TtlCache } from './limits.js';
import { buildReadiness, type Readiness, type ReadinessInput } from './report.js';

const perHost = new SlidingWindow(6, 60_000);
const inFlight = new Semaphore(4);
const cache = new TtlCache<Readiness>(10 * 60_000, 500);

export async function checkReadiness(url: string, rest: Omit<ReadinessInput, 'page'>): Promise<Readiness & { cached: boolean }> {
  const u = validateUrl(url);
  u.hash = '';
  const key = JSON.stringify([u.toString(), rest]);
  const hit = cache.get(key);
  if (hit) return { ...hit, cached: true };
  if (!perHost.take(u.hostname)) throw new LimitError(`Zu viele Prüfungen für ${u.hostname} in der letzten Minute. Bitte in einer Minute erneut versuchen.`, 60);
  if (!inFlight.tryAcquire()) throw new LimitError('Gerade laufen viele Prüfungen. Bitte in ein paar Sekunden erneut versuchen.', 10);
  try {
    const [robots, adsbot, browser] = await Promise.all([
      safeFetch(new URL('/robots.txt', u).toString(), ADSBOT_UA),
      safeFetch(u.toString(), ADSBOT_UA),
      safeFetch(u.toString(), BROWSER_UA),
    ]);
    const r = buildReadiness({ ...rest, page: analyzePage({ url: u.toString(), adsbot, browser, robots }) });
    cache.set(key, r);
    return { ...r, cached: false };
  } finally { inFlight.release(); }
}
