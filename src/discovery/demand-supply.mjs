// Demand vs. supply model for ChatGPT plugin opportunities.
// Demand: share of ChatGPT consumer messages per topic (OpenAI/NBER w34255, May 2024-Jun 2025).
// Supply: ChatGPT app directory listings per category (node8.ai census, Aug 2026, n=2,289).
// Reach: WAU 900M (OpenAI, Feb 2026). Messages/day: 2.5B (NBER, Jul 2025).
// src: 'paper' = number stated in the paper text; 'derived' = residual of a stated group total.

export const WAU = 900e6;
export const MESSAGES_PER_DAY = 2.5e9;

export const TOPICS = [
  // name, share % of all messages, src, directory category, toolLift (0-1: how much an external tool beats native ChatGPT), why
  ['Tutoring / teaching', 10.2, 'paper', 'Education & Research', 0.25, 'Native is strong; tools add curricula, exam banks, progress state'],
  ['Edit / critique text', 10.6, 'paper', 'Productivity', 0.05, 'Pure language task; native wins'],
  ['How-to advice', 8.5, 'paper', 'Other', 0.3, 'Tools add local/official facts and actions'],
  ['Personal writing / communication', 8.0, 'paper', 'Communication', 0.1, 'Mostly native; tools add sending'],
  ['Health, fitness, beauty, self-care', 5.7, 'paper', 'Healthcare', 0.45, 'Tools add verified data, tracking, booking; guidelines restrict sensitive data'],
  ['Creative ideation', 4.6, 'derived', 'Creativity', 0.1, 'Native wins'],
  ['Translation / summary / fiction', 5.4, 'derived', 'Productivity', 0.05, 'Native wins'],
  ['Computer programming', 4.2, 'paper', 'Developer Tools', 0.4, 'Repos, docs, deploys'],
  ['Mathematical calculation', 3.0, 'paper', 'Finance', 0.6, 'Exact rule-based calculation (tax, benefits, loans) beats LLM math'],
  ['Data analysis', 0.4, 'paper', 'Data & Analytics', 0.5, 'Live data sources'],
  ['Specific info (search substitute)', 21.0, 'derived', 'Other', 0.5, 'Fresh, authoritative, local data the model lacks'],
  ['Purchasable products', 2.1, 'paper', 'Business & Operations', 0.8, 'Inventory, prices, checkout: impossible natively'],
  ['Cooking / recipes', 0.9, 'derived', 'Other', 0.2, 'Groceries, nutrition DB'],
  ['Multimedia (create/analyze image, media)', 7.0, 'paper', 'Creativity', 0.3, 'Editable designs, video, music'],
  ['Relationships / reflection / games', 2.4, 'paper', 'Entertainment', 0.05, 'Native'],
];

export const SUPPLY = {
  'Business & Operations': 440, Productivity: 388, Other: 349, Finance: 253, Travel: 232,
  'Education & Research': 136, 'Developer Tools': 128, Entertainment: 90, 'Data & Analytics': 89,
  Creativity: 88, Healthcare: 53, Communication: 24, Security: 19,
};

export function analyse() {
  const rows = TOPICS.map(([topic, share, src, category, lift, why]) => {
    const weeklyMsgs = (MESSAGES_PER_DAY * 7 * share) / 100;
    const addressable = weeklyMsgs * lift; // messages where a tool genuinely adds value
    return { topic, share, src, category, lift, why, weeklyMsgs, addressable };
  });
  // Several topics map to one category: supply is shared in proportion to addressable demand.
  const byCat = {};
  for (const r of rows) byCat[r.category] = (byCat[r.category] ?? 0) + r.addressable;
  for (const r of rows) {
    const apps = SUPPLY[r.category] * (r.addressable / byCat[r.category]);
    r.appsCompeting = apps;
    r.addressablePerApp = r.addressable / Math.max(apps, 1);
  }
  const max = Math.max(...rows.map((r) => r.addressablePerApp));
  for (const r of rows) r.gapIndex = Math.round((100 * r.addressablePerApp) / max);
  return rows.sort((a, b) => b.gapIndex - a.gapIndex);
}
