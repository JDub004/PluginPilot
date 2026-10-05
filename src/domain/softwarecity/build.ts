import { actionFor, de } from './actions.js';
import { locate } from './geo.js';
import type { AppInput, Building, CityInput, CityMap, District, Partner, Person, Quest, Road, Site, SiteLayout } from './schema.js';

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

type Placed = AppInput & { id: string; district: string };

/** Lays out districts in a grid and buildings inside them. Pure; used for the whole company and per site. */
function layout(apps: Placed[], extraDistricts: string[] = []): SiteLayout {
  const order: string[] = [];
  for (const a of apps) if (!order.includes(a.district)) order.push(a.district);
  for (const d of extraDistricts) if (!order.includes(d)) order.push(d);
  order.sort((x, y) => (x === 'Marktplatz' ? -1 : y === 'Marktplatz' ? 1 : 0));
  const cols = Math.max(1, Math.ceil(Math.sqrt(order.length)));
  const districts: District[] = [];
  const positions: Record<string, [number, number]> = {};
  const CELL = 2; // tiles per building incl. street
  let rowY = 0;
  for (let r = 0; r * cols < order.length; r++) {
    let colX = 0;
    let rowH = 0;
    for (let c = 0; c < cols && r * cols + c < order.length; c++) {
      const dName = order[r * cols + c] as string;
      const members = apps.filter((a) => a.district === dName);
      const side = Math.max(2, Math.ceil(Math.sqrt(members.length)));
      const w = side * CELL + 1;
      const h = Math.max(3, Math.ceil(members.length / side) * CELL + 1);
      const district: District = { name: dName, gx: colX, gy: rowY, w, h, buildingIds: [], personIds: [] };
      members.forEach((a, i) => {
        positions[a.id] = [colX + 1 + (i % side) * CELL, rowY + 1 + Math.floor(i / side) * CELL];
        district.buildingIds.push(a.id);
      });
      districts.push(district);
      colX += w + 2; // avenue between districts
      rowH = Math.max(rowH, h);
    }
    rowY += rowH + 2;
  }
  return { districts, positions };
}

const lc = (s: string) => s.trim().toLowerCase();
const districtOf = (department: string) => (SHARED.test(department) ? 'Marktplatz' : department);

/** `today` (YYYY-MM-DD) enables contract-deadline quests; without it the result is independent of the date. */
export function buildCity(input: CityInput, opts: { today?: string } = {}): CityMap {
  // --- ids (unique, stable) ---------------------------------------------------------------
  const used = new Set<string>();
  const uid = (base: string) => { let id = slug(base); for (let i = 2; used.has(id); i++) id = `${slug(base)}-${i}`; used.add(id); return id; };
  const apps: Placed[] = input.apps.map((a) => ({ ...a, id: uid(a.name), district: districtOf(a.department) }));
  const byName = new Map(apps.map((a) => [lc(a.name), a]));
  const peopleIn = input.people ?? [];
  const personIds = peopleIn.map((p) => uid(`person-${p.name}`));

  // --- districts and buildings ---------------------------------------------------------------
  const peopleDistricts = peopleIn.map((p) => districtOf(p.department));
  const main = layout(apps, peopleDistricts);
  const districts = main.districts;
  const buildings: Building[] = apps.map((a) => {
    const [gx, gy] = main.positions[a.id] as [number, number];
    const importance = a.importance ?? (a.critical ? 4 : 3);
    return {
      id: a.id, name: a.name, category: a.category, district: a.district, gx, gy,
      floors: floorsFor(a.users, importance), importance,
      ...(a.site ? { site: a.site } : {}),
      ...(a.users !== undefined ? { users: a.users } : {}),
      ...(a.licenses !== undefined ? { licenses: a.licenses } : {}),
      ...(a.monthlyCostEur !== undefined ? { monthlyCostEur: a.monthlyCostEur } : {}),
      ...(a.owner ? { owner: a.owner } : {}),
      ...(a.renewalDate ? { renewalDate: a.renewalDate, noticeDeadline: addDays(a.renewalDate, -(a.noticePeriodDays ?? 30)) } : {}),
      critical: a.critical, approved: a.approved, questIds: [],
    };
  });

  // --- people: key persons walk in their district ---------------------------------------------
  const people: Person[] = peopleIn.map((p, i) => {
    const id = personIds[i] as string;
    const district = districtOf(p.department);
    districts.find((d) => d.name === district)?.personIds.push(id);
    const ids = new Set<string>();
    for (const n of p.responsibleFor) { const a = byName.get(lc(n)); if (a) ids.add(a.id); }
    for (const a of apps) if (a.owner && (lc(a.owner) === lc(p.name) || (p.role && lc(a.owner) === lc(p.role)))) ids.add(a.id);
    return {
      id, name: p.name, district, buildingIds: [...ids],
      ...(p.role ? { role: p.role } : {}), ...(p.email ? { email: p.email } : {}), ...(p.phone ? { phone: p.phone } : {}), ...(p.note ? { note: p.note } : {}),
    };
  });

  // --- sites: every site gets its own town ------------------------------------------------------
  const sitesIn = input.sites ?? [];
  const mainSite = sitesIn.find((s) => s.main) ?? sitesIn[0];
  const siteIds = sitesIn.map((s) => uid(`site-${s.name}`));
  const siteOfApp = (a: Placed) => sitesIn.find((s) => a.site && (lc(s.name) === lc(a.site) || (s.city && lc(s.city) === lc(a.site))));
  const sites: Site[] = sitesIn.map((s, i) => {
    const isMain = s === mainSite;
    const members = apps.filter((a) => { const own = siteOfApp(a); return own ? own === s : a.district === 'Marktplatz' || isMain; });
    const geo = s.lat !== undefined && s.lon !== undefined ? { lat: s.lat, lon: s.lon } : locate(s.city ?? s.name);
    const lay = layout(members, isMain ? peopleDistricts : []);
    for (const d of lay.districts) d.personIds = people.filter((p) => p.district === d.name && (isMain || d.buildingIds.length > 0)).map((p) => p.id);
    return {
      id: siteIds[i] as string, name: s.name, main: isMain, buildingIds: members.map((a) => a.id), layout: lay,
      ...(s.city ? { city: s.city } : {}), ...(geo ?? {}), ...(s.employees !== undefined ? { employees: s.employees } : {}),
    };
  });

  // --- external partners ------------------------------------------------------------------------
  const partnerNames = new Set((input.partners ?? []).map((p) => lc(p.name)));
  const partners: Partner[] = (input.partners ?? []).map((p) => {
    const ids = new Set<string>();
    for (const n of p.connectedApps) { const a = byName.get(lc(n)); if (a) ids.add(a.id); }
    for (const a of apps) if (a.dataFlowsTo.some((t) => lc(t) === lc(p.name))) ids.add(a.id);
    const geo = p.lat !== undefined && p.lon !== undefined ? { lat: p.lat, lon: p.lon } : locate(p.city);
    const first = apps.find((a) => ids.has(a.id) && siteOfApp(a));
    const site = first ? siteOfApp(first) : mainSite;
    const siteId = site ? siteIds[sitesIn.indexOf(site)] : undefined;
    return {
      id: uid(`partner-${p.name}`), name: p.name, kind: p.kind, buildingIds: [...ids],
      ...(p.city ? { city: p.city } : {}), ...(geo ?? {}), ...(p.contact ? { contact: p.contact } : {}),
      ...(p.email ? { email: p.email } : {}), ...(p.phone ? { phone: p.phone } : {}), ...(p.note ? { note: p.note } : {}),
      ...(siteId ? { siteId } : {}),
    };
  });

  // --- roads -------------------------------------------------------------------------------
  const roads: Road[] = [];
  const quests: Quest[] = [];
  const unknownTargets = new Map<string, string[]>();
  for (const a of apps) {
    for (const t of a.dataFlowsTo) {
      const target = byName.get(t.toLowerCase());
      if (target && target.id !== a.id) roads.push({ from: a.id, to: target.id });
      else if (!target && !partnerNames.has(lc(t))) unknownTargets.set(a.id, [...(unknownTargets.get(a.id) ?? []), t]);
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
      add({ kind: 'unused_licenses', severity: unused / a.licenses >= 0.3 ? 'medium' : 'low', title: `${unused} ungenutzte ${unused === 1 ? 'Lizenz' : 'Lizenzen'} in ${a.name}`,
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

  // One person holds several business-critical programs alone (bus factor).
  for (const p of people) {
    const held = apps.filter((a) => p.buildingIds.includes(a.id));
    const crit = held.filter((a) => a.critical);
    const note = peopleIn[people.indexOf(p)]?.note ?? '';
    if (held.length >= 3 && crit.length >= 2 && !/vertret|deputy|backup|stellvertret/i.test(note)) {
      add({ kind: 'key_person', severity: 'medium', title: `Wissensinsel: ${crit.length} kritische Programme hängen an ${p.name}`,
        detail: `${p.name} ist zuständig für ${held.map((a) => a.name).join(', ')}. Eine Vertretung benennen und Zugänge dokumentieren (Notfallhandbuch), sonst steht bei Urlaub oder Ausfall vieles still.`,
        buildingIds: crit.map((a) => a.id) });
    }
  }

  // Contract deadlines: notice period ends within 90 days.
  if (opts.today) {
    for (const a of apps) {
      if (!a.renewalDate) continue;
      const deadline = addDays(a.renewalDate, -(a.noticePeriodDays ?? 30));
      const days = daysBetween(opts.today, deadline);
      if (days >= 0 && days <= 90) {
        add({ kind: 'renewal', severity: days <= 30 ? 'high' : 'medium', title: `Kündigungsfrist ${a.name}: noch ${days} ${days === 1 ? 'Tag' : 'Tage'} (bis ${de(deadline)})`,
          detail: `Der Vertrag verlängert sich am ${de(a.renewalDate)}. Jetzt entscheiden: behalten, Lizenzen anpassen, nachverhandeln oder kündigen.${a.monthlyCostEur ? ` Es geht um ${eur(a.monthlyCostEur * 12)} pro Jahr.` : ''}`,
          buildingIds: [a.id], deadline });
      } else if (days < 0 && daysBetween(opts.today, a.renewalDate) >= 0) {
        add({ kind: 'renewal', severity: 'low', title: `Kündigungsfrist ${a.name} verpasst`,
          detail: `Die Frist endete am ${de(deadline)}; der Vertrag verlängert sich am ${de(a.renewalDate)}. Für die nächste Laufzeit eine Erinnerung setzen oder beim Anbieter nach Kulanz fragen.`, buildingIds: [a.id], deadline });
      }
    }
  }
  for (const q of quests) q.action = actionFor(q, apps, people, input.company);

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
    people,
    sites,
    partners,
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

/** Height = users (log scale) plus importance: core programs (5) get +2 floors, nice-to-haves (1) −2. */
function floorsFor(users: number | undefined, importance: number): number {
  const base = users ? Math.round(1 + Math.log2(users)) : 1;
  return Math.max(1, Math.min(9, base + importance - 3));
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
function eur(n: number): string {
  return `${Math.round(n).toLocaleString('de-DE')} €`;
}
