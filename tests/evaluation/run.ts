// Offline evaluation: (1) golden statements → expected findings, (2) prompt library integrity.
// Tool-selection accuracy needs real ChatGPT runs: record them in tests/evaluation/results/*.csv (see docs/EVALUATION.md).
import { readFileSync } from 'node:fs';
import { checkStatement } from '../../src/domain/nebenkosten/check.js';
import { StatementSchema } from '../../src/domain/nebenkosten/schema.js';

interface Golden {
  id: string;
  input: unknown;
  expect: { verdict: string; findingIds: string[]; minOverchargeEur?: number; maxOverchargeEur?: number };
}
const dir = new URL('./', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('golden/cases.json', dir), 'utf8')) as Golden[];
let failed = 0;
for (const c of cases) {
  const r = checkStatement(StatementSchema.parse(c.input));
  const ids = r.findings.map((f) => f.id);
  const problems: string[] = [];
  if (r.verdict !== c.expect.verdict) problems.push(`verdict ${r.verdict} != ${c.expect.verdict}`);
  for (const id of c.expect.findingIds) if (!ids.includes(id)) problems.push(`missing ${id}`);
  if (c.expect.minOverchargeEur !== undefined && r.estimatedOverchargeEur < c.expect.minOverchargeEur) problems.push(`overcharge ${r.estimatedOverchargeEur} < ${c.expect.minOverchargeEur}`);
  if (c.expect.maxOverchargeEur !== undefined && r.estimatedOverchargeEur > c.expect.maxOverchargeEur) problems.push(`overcharge ${r.estimatedOverchargeEur} > ${c.expect.maxOverchargeEur}`);
  failed += problems.length ? 1 : 0;
  console.log(`${problems.length ? 'FAIL' : 'PASS'} ${c.id} (${r.estimatedOverchargeEur} €) ${problems.join('; ')}`);
}

const prompts = JSON.parse(readFileSync(new URL('prompts.json', dir), 'utf8')) as { id: string; category: string }[];
const byCat = prompts.reduce<Record<string, number>>((a, p) => ({ ...a, [p.category]: (a[p.category] ?? 0) + 1 }), {});
const unique = new Set(prompts.map((p) => p.id)).size === prompts.length;
console.log(`prompt library: ${prompts.length} prompts`, byCat, unique ? '' : 'DUPLICATE IDS');
if (failed || !unique) process.exit(1);
