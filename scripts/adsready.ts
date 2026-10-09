// CLI: npx tsx scripts/adsready.ts <url> [--json] [--ad "Titel|Text"]... [--offer "…" --audience "…" --problem "…"]
//      [--budget 1000 --cpc 3,5,8 --cvr 0.01,0.03,0.06 --value 1200 --margin 0.3 --current-cpa 300] [--by "Agentur"]
import { checkReadiness } from '../src/domain/adsready/run.js';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const all = (k: string) => args.flatMap((a, i) => (a === `--${k}` ? [args[i + 1] ?? ''] : []));
const one = (k: string) => all(k)[0];
const nums = (k: string) => one(k)?.split(',').map(Number) as [number, number, number] | undefined;
if (!url) { console.error('Usage: npx tsx scripts/adsready.ts <url> [--json] [--ad "Titel|Text"] [--offer … --audience …] [--budget … --cpc a,b,c --cvr a,b,c]'); process.exit(2); }

const offer = one('offer'), audience = one('audience');
const budget = one('budget'), cpc = nums('cpc'), cvr = nums('cvr');
const r = await checkReadiness(url, {
  date: new Date().toISOString().slice(0, 10),
  ads: all('ad').map((s) => { const [title = '', copy = ''] = s.split('|'); return { title, copy }; }),
  ...(offer && audience ? { offering: { offer, audience, problems: all('problem'), occasions: all('occasion'), alternatives: all('alternative') } } : {}),
  ...(budget && cpc && cvr ? { assumptions: { budget: Number(budget), cpc, cvr, ...(one('value') ? { valuePerConversion: Number(one('value')) } : {}), ...(one('margin') ? { margin: Number(one('margin')) } : {}), ...(one('current-cpa') ? { currentCostPerConversion: Number(one('current-cpa')) } : {}) } } : {}),
  ...(one('by') ? { preparedBy: one('by') as string } : {}),
});
if (args.includes('--json')) { const { markdown: _m, ...json } = r; console.log(JSON.stringify(json, null, 2)); } else console.log(r.markdown);
process.exit(r.verdict === 'blockiert' ? 1 : 0);
