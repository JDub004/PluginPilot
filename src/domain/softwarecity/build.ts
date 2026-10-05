import type { AppInput, Building, CityInput, CityMap, District, Quest, Road } from './schema.js';

const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
const SHARED = /^(alle|all|company-wide|unternehmen|gesamt|everyone|firmenweit)$/i;
const SPREADSHEET_LIKE = /\.(xlsx?|csv|ods|numbers)$|excel|google sheets|tabelle|liste/i;
const LABEL: Record<string, string> = {
  crm: 'CRM', erp: 'ERP', accounting: 'Buchhaltung', hr: 'Personal', communication: 'Kommunikation', collaboration: 'Zusammenarbeit',
  storage: 'Dateiablage', spreadsheet: 'Tabellen', dev: 'Entwicklung', marketing: 'Marketing', support: 'Kundenservice',
  security: 'Sicherheit', analytics: 'Auswertung', ecommerce: 'Onlineshop', other: 'Sonstiges',
};
// Categories where several tools usually mean real overlap (not e.g. "other" or "dev").
const OVERLAP_CATEGORIES = new Set(['crm', 'erp', 'accounting', 'hr', 'communication', 'collaboration', 'storage', 'support', 'analytics']);

export function buildCity(input: CityInput): CityMap {
  // --- ids (unique, stable) ---------------------------------------------------------------
  const used = new Set<string>();
  const apps = input.apps.map((a) => {
    let id = slug(a.name);
    for (let i = 2; used.has(id); i++) id = `${slug(a.name)}-${i}`;
    used.add(id);
    return { ...a, id };
  });
  const byName = new Map(apps.map((a) => [a.name.toLowerCase(), a]));

  // --- districts: shared tools form the central "Marktplatz" -------------------------------
  const order: string[] = [];
  for (const a of apps) {
    const d = SHARED.test(a.department) ? 'Marktplatz' : a.department;
    (a as typeof a & { district: string }).district = d;
    if (!order.includes(d)) order.push(d);
  }
  order.sort((x, y) => (x === 'Marktplatz' ? -1 : y === 'Marktplatz' ? 1 : 0));

  const cols = Math.max(1, Math.ceil(Math.sqrt(order.length)));
  const districts: District[] = [];
  const buildings: Building[] = [];
  const CELL = 2; // tiles per building incl. street
  let rowY = 0;
  for (let r = 0; r * cols < order.length; r++) {
    let colX = 0;
    let rowH = 0;
    for (let c = 0; c < cols && r * cols + c < order.length; c++) {
      const dName = order[r * cols + c] as string;
      const members = apps.filter((a) => (a as typeof a & { district: string }).district === dName);
      const side = Math.max(2, Math.ceil(Math.sqrt(members.length)));
      const w = side * CELL + 1;
      const h = Math.ceil(members.length / side) * CELL + 1;
      const district: District = { name: dName, gx: colX, gy: rowY, w, h, buildingIds: [] };
      members.forEach((a, i) => {
        const b: Building = {
          id: a.id, name: a.name, category: a.category, district: dName,
          gx: colX + 1 + (i % side) * CELL, gy: rowY + 1 + Math.floor(i / side) * CELL,
          floors: floorsFor(a.users),
          ...(a.users !== undefined ? { users: a.users } : {}),
          ...(a.licenses !== undefined ? { licenses: a.licenses } : {}),
          ...(a.monthlyCostEur !== undefined ? { monthlyCostEur: a.monthlyCostEur } : {}),
          ...(a.owner ? { owner: a.owner } : {}),
          critical: a.critical, approved: a.approved, questIds: [],
        };
        buildings.push(b);
        district.buildingIds.push(b.id);
      });
      districts.push(district);
      colX += w + 2; // avenue between districts
      rowH = Math.max(rowH, h);
    }
    rowY += rowH + 2;
  }

  // --- roads -------------------------------------------------------------------------------
  const roads: Road[] = [];
  const quests: Quest[] = [];
  const unknownTargets = new Map<string, string[]>();
  for (const a of apps) {
    for (const t of a.dataFlowsTo) {
      const target = byName.get(t.toLowerCase());
      if (target && target.id !== a.id) roads.push({ from: a.id, to: target.id });
      else if (!target) unknownTargets.set(a.id, [...(unknownTargets.get(a.id) ?? []), t]);
    }
  }

  // --- quests (deterministic rules) ---------------------------------------------------------
  let qn = 0;
  const add = (q: Omit<Quest, 'id'>) => {
    const quest = { ...q, id: `q${++qn}` };
    quests.push(quest);
    for (const id of q.buildingIds) buildings.find((b) => b.id === id)?.questIds.push(quest.id);
  };

  // Overlapping tools in the same category
  const byCat = new Map<string, typeof apps>();
  for (const a of apps) if (OVERLAP_CATEGORIES.has(a.category)) byCat.set(a.category, [...(byCat.get(a.category) ?? []), a]);
  for (const [cat, list] of byCat) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((x, y) => (y.users ?? 0) - (x.users ?? 0));
    const keep = sorted[0] as AppInput & { id: string };
    const others = sorted.slice(1);
    const saving = others.reduce((s, a) => s + (a.monthlyCostEur ?? 0), 0) * 12;
    add({
      kind: 'duplicate', severity: list.length >= 3 ? 'high' : 'medium',
      title: `${list.length} Tools für ${LABEL[cat]}`,
      detail: `${list.map((a) => a.name).join(', ')} erfüllen denselben Zweck. Prüfen, ob sich alles in ${keep.name} (meiste Nutzer) bündeln lässt.${saving ? ` Mögliche Ersparnis ohne die übrigen Tools: ${eur(saving)} pro Jahr.` : ''}`,
      buildingIds: list.map((a) => a.id),
      ...(saving ? { savingEurYear: saving } : {}),
    });
  }
  for (const a of apps) {
    if (a.licenses !== undefined && a.users !== undefined && a.licenses > a.users && a.monthlyCostEur) {
      const unused = a.licenses - a.users;
      const saving = Math.round((a.monthlyCostEur / a.licenses) * unused * 12);
      add({ kind: 'unused_licenses', severity: unused / a.licenses >= 0.3 ? 'medium' : 'low', title: `${unused} ungenutzte Lizenzen in ${a.name}`,
        detail: `${a.licenses} Lizenzen, aber nur ${a.users} Nutzer. Kündigen spart rund ${eur(saving)} pro Jahr.`, buildingIds: [a.id], savingEurYear: saving });
    }
    if (a.critical && (a.category === 'spreadsheet' || SPREADSHEET_LIKE.test(a.name))) {
      add({ kind: 'critical_spreadsheet', severity: 'high', title: `Kritische Daten in einer Tabelle: ${a.name}`,
        detail: 'Geschäftskritische Daten liegen in einer Tabellendatei. Risiko: versehentliches Überschreiben, keine Rechte, kein Verlauf. Backup und Zugriffsrechte prüfen oder in ein passendes System überführen.', buildingIds: [a.id] });
    }
    if (!a.owner && (a.critical || (a.users ?? 0) >= 5)) {
      add({ kind: 'no_owner', severity: a.critical ? 'high' : 'medium', title: `Niemand verantwortlich für ${a.name}`,
        detail: 'Ohne Verantwortlichen kümmert sich niemand um Updates, Zugänge und Kündigung. Eine Person benennen.', buildingIds: [a.id] });
    }
    if (!a.approved) {
      add({ kind: 'shadow_it', severity: a.critical ? 'high' : 'medium', title: `Schatten-IT: ${a.name}`,
        detail: 'Ohne Freigabe eingeführt. Datenschutz (Auftragsverarbeitung), Zugänge und Kosten klären.', buildingIds: [a.id] });
    }
    const connected = roads.some((r) => r.from === a.id || r.to === a.id);
    if (!connected && ['crm', 'erp', 'accounting', 'ecommerce', 'support', 'hr'].includes(a.category) && (a.users ?? 0) >= 3) {
      add({ kind: 'data_island', severity: 'low', title: `Dateninsel: ${a.name}`,
        detail: 'Keine Verbindung zu anderen Programmen erfasst. Werden Daten von Hand übertragen? Dann lohnt sich eine Schnittstelle.', buildingIds: [a.id] });
    }
    const unknown = unknownTargets.get(a.id);
    if (unknown) {
      add({ kind: 'unknown_flow', severity: 'low', title: `Unbekanntes Ziel von ${a.name}`,
        detail: `Daten fließen an ${unknown.join(', ')}, das nicht in der Liste steht. Fehlt hier ein Programm?`, buildingIds: [a.id] });
    }
  }

  const sevOrder = { high: 0, medium: 1, low: 2 } as const;
  quests.sort((x, y) => sevOrder[x.severity] - sevOrder[y.severity] || (y.savingEurYear ?? 0) - (x.savingEurYear ?? 0));
  const potentialSavingsEurYear = quests.reduce((s, q) => s + (q.savingEurYear ?? 0), 0);
  const penalty = quests.reduce((s, q) => s + (q.severity === 'high' ? 12 : q.severity === 'medium' ? 6 : 2), 0);

  return {
    company: input.company,
    districts,
    buildings,
    roads,
    quests,
    stats: {
      apps: apps.length,
      districts: districts.length,
      monthlyCostEur: apps.reduce((s, a) => s + (a.monthlyCostEur ?? 0), 0),
      potentialSavingsEurYear,
      // Penalty relative to city size: one high issue per app would mean 0.
      healthScore: Math.max(0, Math.round(100 - (penalty / (apps.length * 12)) * 100)),
    },
    disclaimer: 'Karte und Hinweise beruhen nur auf den angegebenen Daten. Ersparnisse sind Schätzungen vor Kündigungsfristen und Umstellungskosten.',
  };
}

function floorsFor(users?: number): number {
  if (!users) return 1;
  return Math.max(1, Math.min(7, Math.round(1 + Math.log2(users))));
}
function eur(n: number): string {
  return `${Math.round(n).toLocaleString('de-DE')} €`;
}
