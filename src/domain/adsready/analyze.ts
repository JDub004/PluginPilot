// Landing-page analysis from fetched responses. Pure: no network here, so every rule is unit-tested.
// Important: our request only *simulates* OAI-AdsBot (same user agent, different IP). A WAF that verifies bots by IP can
// treat the real crawler differently, so a pass is "simuliert", never "verifiziert".
import type { FetchResult } from './fetch.js';
import { robotsFromStatus, type RobotsState } from './robots.js';

export type Status = 'ok' | 'warn' | 'block';
export interface PageFinding { status: Status; code: string; title: string; detail: string; fix?: string }
export interface PageReport { url: string; reachable: 'simuliert erreichbar' | 'blockiert' | 'unsicher'; robots: RobotsState; cdn?: string; lang?: string; words: number; text: string; findings: PageFinding[] }

// Interstitial markers. Product pages may mention these words (e.g. Cloudflare's own "Turnstile" page), so a marker only
// counts when the response also looks like an interstitial: an error status or very little visible text.
const CHALLENGE = [
  [/cf-chl|challenge-platform|cf_chl_opt|Attention Required! \| Cloudflare|<title>Just a moment\.\.\.<\/title>/i, 'Cloudflare-Challenge'],
  [/_Incapsula_Resource/i, 'Imperva/Incapsula'],
  [/captcha-delivery\.com|datadome/i, 'DataDome'],
  [/px-captcha|_pxhd/i, 'PerimeterX/HUMAN'],
  [/Reference #[0-9a-f]+\.[0-9a-f]+/i, 'Akamai'],
  [/g-recaptcha|h-captcha|hcaptcha\.com|cf-turnstile/i, 'CAPTCHA'],
  [/verify you are (a )?human|are you a robot|access denied/i, 'Bot-Sperre'],
] as const;

export function visibleText(html: string): string {
  return html.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

export function detectCdn(h: Record<string, string>): string | undefined {
  if (h['cf-ray'] || /cloudflare/i.test(h.server ?? '')) return 'Cloudflare';
  if (h['x-shopid'] || h['x-shopify-stage'] || /shopify/i.test(h['powered-by'] ?? '')) return 'Shopify';
  if (/akamai/i.test(h.server ?? '') || h['x-akamai-transformed']) return 'Akamai';
  if (h['x-served-by']?.includes('cache-') || h['x-fastly-request-id']) return 'Fastly';
  if (h['x-amz-cf-id']) return 'Amazon CloudFront';
  if (h['x-sucuri-id']) return 'Sucuri';
  return undefined;
}

export const FIX: Record<string, string> = {
  Cloudflare: 'Cloudflare: Security → WAF → Custom rule "Skip" für den verifizierten Bot OAI-AdsBot (Bot-Kategorie bzw. User-Agent + OpenAI-IP-Bereiche) nur für die Landingpage-Pfade anlegen. Bot Fight Mode nicht komplett abschalten. Unter "AI Crawl Control" bzw. "Block AI bots" prüfen, ob OpenAI-Crawler gesperrt sind.',
  Shopify: 'Shopify: robots.txt.liquid prüfen (Online Store → Themes → Code). Liegt Cloudflare oder eine Bot-App davor, dort die Ausnahme für OAI-AdsBot setzen. Als Ziel eine Produkt- oder Kollektionsseite statt der Startseite wählen.',
  Akamai: 'Akamai Bot Manager: OAI-AdsBot als "allowed/verified bot" für die Landingpage-Pfade freigeben (über die IT bzw. den Hoster).',
  Fastly: 'Fastly/WAF: Ausnahme für OAI-AdsBot auf den Landingpage-Pfaden (über die IT bzw. den Hoster).',
  'Amazon CloudFront': 'AWS WAF: Bot-Control-Regel um eine Ausnahme für OAI-AdsBot auf den Landingpage-Pfaden ergänzen.',
  Sucuri: 'Sucuri Firewall: OAI-AdsBot in der Allowlist für die Landingpage-Pfade eintragen.',
  default: 'Bei IT, Hoster oder Agentur eine Ausnahme für den Crawler OAI-AdsBot nur für die Landingpage-Pfade anfragen (CDN/WAF/Bot-Schutz). Betrugsschutz für Checkout und Login bleibt aktiv.',
};

const marker = (r: FetchResult) => {
  const looksBlocked = (r.status ?? 0) >= 400 || visibleText(r.body).split(' ').length < 150;
  return looksBlocked ? CHALLENGE.find(([re]) => re.test(r.body))?.[1] : undefined;
};

export function analyzePage(input: { url: string; adsbot: FetchResult; browser: FetchResult; robots: FetchResult }): PageReport {
  const { adsbot: a, browser: b } = input;
  const f: PageFinding[] = [];
  const u = new URL(input.adsbot.url || input.url);
  const robots = robotsFromStatus(input.robots.status, input.robots.body, 'OAI-AdsBot', u.pathname + u.search);
  const cdn = detectCdn({ ...b.headers, ...a.headers });
  const fix = FIX[cdn ?? 'default'] ?? FIX.default!;
  const text = visibleText(a.body || b.body);
  const words = text ? text.split(' ').length : 0;
  const lang = (a.body || b.body).match(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i)?.[1]?.toLowerCase();

  if (robots.state === 'blocked') f.push({ status: 'block', code: 'robots_blocked', title: 'robots.txt sperrt OAI-AdsBot', detail: robots.detail, fix: 'In robots.txt eine Gruppe "User-agent: OAI-AdsBot" mit "Allow: /" (oder den Landingpage-Pfaden) ergänzen.' });
  else if (robots.state === 'uncertain') f.push({ status: 'warn', code: 'robots_uncertain', title: 'robots.txt nicht abrufbar', detail: robots.detail, fix: 'robots.txt muss mit HTTP 200 oder 404 antworten, nicht mit 5xx.' });
  else f.push({ status: 'ok', code: 'robots_ok', title: 'robots.txt erlaubt OAI-AdsBot', detail: robots.detail });

  const aMarker = marker(a), bMarker = marker(b);
  let reachable: PageReport['reachable'] = 'simuliert erreichbar';
  if (a.error || a.status === null) { reachable = 'unsicher'; f.push({ status: 'warn', code: 'fetch_failed', title: 'Seite nicht abrufbar', detail: a.error ?? 'Kein Abruf möglich.' }); }
  else if (a.status >= 400 || aMarker) {
    reachable = 'blockiert';
    const vsBrowser = b.status && b.status < 400 && !bMarker ? ' Mit Browser-Kennung lädt die Seite normal: Die Sperre gilt gezielt Bots.' : '';
    f.push({ status: 'block', code: 'bot_wall', title: `Bot-Sperre${aMarker ? ` (${aMarker})` : ''}${cdn ? ` über ${cdn}` : ''}`, detail: `Mit der Kennung von OAI-AdsBot antwortet die Seite mit HTTP ${a.status}.${vsBrowser} Laut OpenAI muss OAI-AdsBot die Seite für die Anzeigenprüfung erreichen.`, fix });
  } else {
    f.push({ status: 'ok', code: 'reachable_simulated', title: 'Mit OAI-AdsBot-Kennung erreichbar (simuliert, nicht verifiziert)', detail: `HTTP ${a.status}. Wir senden die Kennung von OAI-AdsBot, aber nicht von OpenAIs IP-Adressen. Prüft eure Firewall Bots per IP, kann der echte Crawler anders behandelt werden. Sicher ist nur ein Blick in die Server-Logs nach Anfragen von OAI-AdsBot.` });
  }
  if (a.redirects.length && new URL(a.url).hostname !== new URL(input.url).hostname) f.push({ status: 'warn', code: 'cross_domain_redirect', title: 'Weiterleitung auf andere Domain', detail: `Ziel landet auf ${new URL(a.url).hostname}. Anzeige und Zielseite sollten dieselbe Adresse haben.` });
  if (/<input[^>]+type=["']?password/i.test(a.body)) f.push({ status: 'block', code: 'login', title: 'Zielseite verlangt eine Anmeldung', detail: 'Seiten hinter einem Login kann OAI-AdsBot nicht prüfen.', fix: 'Eine öffentlich lesbare Seite zum Angebot verlinken.' });
  if (reachable !== 'blockiert' && a.status && a.status < 400 && words < 80) f.push({ status: 'warn', code: 'thin_text', title: 'Kaum lesbarer Text', detail: `Nur ${words} Wörter ohne JavaScript sichtbar. Inhalte, die erst per JavaScript geladen werden (z. B. Buchungsmaschinen), sieht ein Crawler eventuell nicht.`, fix: 'Auf eine Seite mit beschreibendem Text verlinken; die Buchung erst von dort aus.' });
  if (u.pathname === '/' || u.pathname === '') f.push({ status: 'warn', code: 'homepage', title: 'Startseite als Ziel', detail: 'OpenAI empfiehlt die passendste Unterseite (Produkt, Kategorie, Angebot) statt der Startseite.' });
  if (/apps\.apple\.com|play\.google\.com/.test(u.hostname)) f.push({ status: 'warn', code: 'app_store', title: 'App-Store-Link', detail: 'Eine normale Webseite wird bevorzugt.' });
  if (u.protocol !== 'https:') f.push({ status: 'warn', code: 'http', title: 'Ohne HTTPS', detail: 'Die Zielseite sollte HTTPS nutzen.' });
  return { url: a.url || input.url, reachable, robots: robots.state, ...(cdn ? { cdn } : {}), ...(lang ? { lang } : {}), words, text, findings: f };
}
