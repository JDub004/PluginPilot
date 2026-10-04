// Classification of cost lines against § 2 BetrKV (allocable operating costs)
// and typical non-allocable items. Matching is keyword based on a normalised label.

export type Category =
  | { kind: 'allocable'; code: string; name: string }
  | { kind: 'not_allocable'; code: string; name: string; reason: string }
  | { kind: 'unknown' };

interface Rule {
  pattern: RegExp;
  category: Exclude<Category, { kind: 'unknown' }>;
}

// Order matters: non-allocable rules run first so "Reparatur Aufzug" is not matched as "Aufzug".
const RULES: Rule[] = [
  { pattern: /verwalt/, category: { kind: 'not_allocable', code: 'NA-ADMIN', name: 'Verwaltungskosten', reason: 'Verwaltungskosten sind nach § 1 Abs. 2 Nr. 1 BetrKV keine Betriebskosten.' } },
  { pattern: /reparatur|instandhalt|instandsetz|sanierung|erneuerung|ersatzbeschaff/, category: { kind: 'not_allocable', code: 'NA-REPAIR', name: 'Instandhaltung/Reparatur', reason: 'Instandhaltungs- und Instandsetzungskosten sind nach § 1 Abs. 2 Nr. 2 BetrKV keine Betriebskosten.' } },
  { pattern: /ruecklage|rucklage|instandhaltungsr/, category: { kind: 'not_allocable', code: 'NA-RESERVE', name: 'Rücklagen', reason: 'Rücklagen (z. B. Instandhaltungsrücklage) dürfen nicht auf Mieter umgelegt werden.' } },
  { pattern: /kontofuehr|kontofuhr|bankgebuehr|bankgebuhr|bankspesen/, category: { kind: 'not_allocable', code: 'NA-BANK', name: 'Bankgebühren', reason: 'Kontoführungs- und Bankgebühren sind Verwaltungskosten (§ 1 Abs. 2 Nr. 1 BetrKV).' } },
  { pattern: /porto|telefon(?!.*notruf)|buero|buro|rechtsanwalt|anwalt|gericht/, category: { kind: 'not_allocable', code: 'NA-OFFICE', name: 'Büro-/Rechtskosten', reason: 'Porto, Telefon, Büro- und Rechtskosten sind Verwaltungskosten und nicht umlagefähig.' } },
  { pattern: /leerstand/, category: { kind: 'not_allocable', code: 'NA-VACANCY', name: 'Leerstandskosten', reason: 'Kosten leerstehender Wohnungen trägt der Vermieter, nicht die übrigen Mieter.' } },

  { pattern: /grundsteuer|grundbesitzabgab|oeffentliche lasten|offentliche lasten/, category: { kind: 'allocable', code: '1', name: 'Öffentliche Lasten (Grundsteuer)' } },
  { pattern: /kaltwasser|frischwasser|wasserversorg|^wasser|wasser ?geld|wasserzaehler|wasserzahler/, category: { kind: 'allocable', code: '2', name: 'Wasserversorgung' } },
  { pattern: /abwasser|entwaesser|entwasser|kanal|niederschlag|schmutzwasser/, category: { kind: 'allocable', code: '3', name: 'Entwässerung' } },
  { pattern: /heiz|waerme|warme|brennstoff|fernwaerme|fernwarme|gas|oel|ol\b|heizoel|heizol/, category: { kind: 'allocable', code: '4', name: 'Heizung' } },
  { pattern: /warmwasser/, category: { kind: 'allocable', code: '5', name: 'Warmwasser' } },
  { pattern: /aufzug|fahrstuhl|lift/, category: { kind: 'allocable', code: '7', name: 'Aufzug' } },
  { pattern: /strassenreinig|strasenreinig|muell|mull|abfall|winterdienst|schnee/, category: { kind: 'allocable', code: '8', name: 'Straßenreinigung und Müllbeseitigung' } },
  { pattern: /gebaeudereinig|gebaudereinig|treppenhaus|hausreinig|ungeziefer|schaedlings|schadlings/, category: { kind: 'allocable', code: '9', name: 'Gebäudereinigung und Ungezieferbekämpfung' } },
  { pattern: /garten|gruen|grun/, category: { kind: 'allocable', code: '10', name: 'Gartenpflege' } },
  { pattern: /beleucht|allgemeinstrom|hausstrom|strom allgemein|^strom/, category: { kind: 'allocable', code: '11', name: 'Beleuchtung (Allgemeinstrom)' } },
  { pattern: /schornstein|kaminkehr|kehrgebuehr|kehrgebuhr/, category: { kind: 'allocable', code: '12', name: 'Schornsteinreinigung' } },
  { pattern: /versicherung/, category: { kind: 'allocable', code: '13', name: 'Sach- und Haftpflichtversicherung' } },
  { pattern: /hauswart|hausmeister/, category: { kind: 'allocable', code: '14', name: 'Hauswart' } },
  { pattern: /antenne|kabel|breitband|gemeinschaftsantenne/, category: { kind: 'allocable', code: '15', name: 'Gemeinschaftsantenne/Breitbandnetz' } },
  { pattern: /wasch/, category: { kind: 'allocable', code: '16', name: 'Einrichtungen der Wäschepflege' } },
  { pattern: /rauchwarn|rauchmelder|dachrinn|wartung|pruefung|prufung|sonstige/, category: { kind: 'allocable', code: '17', name: 'Sonstige Betriebskosten (nur bei ausdrücklicher Vereinbarung im Mietvertrag)' } },
];

export function normaliseLabel(label: string): string {
  return label
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classify(label: string): Category {
  const n = normaliseLabel(label);
  for (const rule of RULES) if (rule.pattern.test(n)) return rule.category;
  return { kind: 'unknown' };
}
