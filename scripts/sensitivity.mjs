// Monte Carlo sensitivity of the demand/supply gap ranking.
// Each run: toolLift ~ U(0.5x, 1.5x) clipped to [0,1]; topic share ~ N(share, 15%); supply ~ N(count, 20%).
import { TOPICS, SUPPLY } from '../src/discovery/demand-supply.mjs';

let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const normal = (m, sd) => m + sd * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());

const N = 10_000;
const top3 = Object.fromEntries(TOPICS.map((t) => [t[0], 0]));
const first = { ...top3 };
const ranks = Object.fromEntries(TOPICS.map((t) => [t[0], []]));
for (let i = 0; i < N; i++) {
  const supply = Object.fromEntries(Object.entries(SUPPLY).map(([k, v]) => [k, Math.max(1, normal(v, v * 0.2))]));
  const rows = TOPICS.map(([topic, share, , cat, lift]) => ({
    topic, cat,
    a: Math.max(0, normal(share, share * 0.15)) * Math.min(1, lift * (0.5 + rand())),
  }));
  const byCat = {};
  for (const r of rows) byCat[r.cat] = (byCat[r.cat] ?? 0) + r.a;
  for (const r of rows) r.score = r.a / Math.max(1, supply[r.cat] * (r.a / (byCat[r.cat] || 1)));
  rows.sort((x, y) => y.score - x.score);
  rows.forEach((r, k) => ranks[r.topic].push(k + 1));
  rows.slice(0, 3).forEach((r) => top3[r.topic]++);
  first[rows[0].topic]++;
}
const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p = (a, q) => a[Math.floor(a.length * q)];
console.log('topic | P(rank1) | P(top3) | median rank | 90% interval');
Object.keys(top3)
  .sort((a, b) => top3[b] - top3[a])
  .forEach((t) => console.log(`${t} | ${(100 * first[t] / N).toFixed(1)}% | ${(100 * top3[t] / N).toFixed(1)}% | ${median(ranks[t])} | ${p(ranks[t], 0.05)}-${p(ranks[t], 0.95)}`));
