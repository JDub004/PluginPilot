// Orchestration: fetch robots.txt, the page as OAI-AdsBot and as a browser, then analyse. The only module with network.
import { analyzePage } from './analyze.js';
import { ADSBOT_UA, BROWSER_UA, safeFetch, validateUrl } from './fetch.js';
import { buildReadiness, type ReadinessInput } from './report.js';

export async function checkReadiness(url: string, rest: Omit<ReadinessInput, 'page'>) {
  const u = validateUrl(url);
  const [robots, adsbot, browser] = await Promise.all([
    safeFetch(new URL('/robots.txt', u).toString(), ADSBOT_UA),
    safeFetch(u.toString(), ADSBOT_UA),
    safeFetch(u.toString(), BROWSER_UA),
  ]);
  return buildReadiness({ ...rest, page: analyzePage({ url: u.toString(), adsbot, browser, robots }) });
}
