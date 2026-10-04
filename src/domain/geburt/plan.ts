import { z } from 'zod';
import { addDays, addMonths, daysBetween, endOfMonthAfter, parseIso } from '../trauerfall/calendar.js';
import type { Plan, Step } from '../trauerfall/schema.js';

export const RULES_VERSION = '2026.10.0';
const G = 'https://www.gesetze-im-internet.de/';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format JJJJ-MM-TT');

export const BirthSituationSchema = z
  .object({
    birthDate: isoDate.describe('Date of birth (YYYY-MM-DD)'),
    bornInHospital: z.boolean().default(true).describe('Born in a hospital or birth centre (then the clinic notifies the Standesamt)'),
    parentsMarried: z.boolean().default(true),
    singleParent: z.boolean().default(false).describe('The child lives with one parent only'),
    motherEmployed: z.boolean().default(false).describe('The birth mother is employed'),
    motherStatutoryInsured: z.boolean().default(true).describe('The mother has statutory health insurance (gesetzlich)'),
    otherParentEmployed: z.boolean().default(false),
    otherParentLeaveStart: isoDate.optional().describe('Planned start of the other parent\'s Elternzeit, if known'),
    pretermOrMultiple: z.boolean().default(false).describe('Premature birth, twins/multiples, or a disability diagnosed in the first 8 weeks'),
    lowIncome: z.boolean().default(false).describe('Household has low income (possible Kinderzuschlag/Wohngeld)'),
    needsChildcare: z.boolean().default(false).describe('A Kita or day-care place will be needed'),
  })
  .strict();
export type BirthSituation = z.infer<typeof BirthSituationSchema>;

export class InvalidBirthSituationError extends Error {}

type Draft = Omit<Step, 'daysLeft' | 'overdue'>;

export function planAfterBirth(s: BirthSituation, today: string): Plan {
  parseIso(s.birthDate);
  if (s.birthDate > today) throw new InvalidBirthSituationError('Das Geburtsdatum liegt in der Zukunft.');
  if (daysBetween(s.birthDate, today) > 3 * 366) throw new InvalidBirthSituationError('Das Geburtsdatum liegt mehr als drei Jahre zurück.');
  if (s.otherParentLeaveStart) parseIso(s.otherParentLeaveStart);

  const b = s.birthDate;
  const protectionWeeks = s.pretermOrMultiple ? 12 : 8;
  const protectionEnd = addDays(b, protectionWeeks * 7);
  const d: Draft[] = [];

  d.push({
    id: 'geburtsanzeige', phase: 'erste_woche',
    title: s.bornInHospital ? 'Geburtsurkunden beim Standesamt beantragen' : 'Geburt beim Standesamt anzeigen',
    dueDate: addDays(b, 7), dueLabel: 'binnen einer Woche', critical: !s.bornInHospital,
    office: 'Standesamt des Geburtsortes',
    documents: s.parentsMarried
      ? ['Personalausweise', 'Eheurkunde bzw. Geburtsurkunden der Eltern', 'ggf. Namenserklärung']
      : ['Personalausweis der Mutter', 'Geburtsurkunde der Mutter', 'ggf. Vaterschaftsanerkennung und Sorgeerklärung'],
    why: s.bornInHospital
      ? 'Die Klinik zeigt die Geburt an. Sie reichen die Unterlagen und den Vornamen nach und erhalten die Geburtsurkunden. Mehrere kostenfreie Exemplare für Elterngeld, Kindergeld und Krankenkasse mitbestellen.'
      : 'Bei einer Hausgeburt müssen die Eltern die Geburt selbst innerhalb einer Woche anzeigen.',
    legalBasis: s.bornInHospital ? '§§ 18, 20 PStG' : '§ 18 PStG', sourceUrl: G + 'pstg/__18.html',
  });
  if (!s.parentsMarried) {
    d.push({
      id: 'vaterschaft', phase: 'erste_woche', title: 'Vaterschaft anerkennen und gemeinsames Sorgerecht erklären',
      dueLabel: 'so bald wie möglich', critical: false, office: 'Jugendamt (kostenlos) oder Standesamt/Notar',
      documents: ['Personalausweise beider Eltern', 'Geburtsurkunde des Kindes'],
      why: 'Ohne Ehe ist der Vater rechtlich erst mit der Anerkennung Vater. Das gemeinsame Sorgerecht braucht eine eigene Sorgeerklärung.',
      legalBasis: '§§ 1592, 1594, 1626a BGB', sourceUrl: G + 'bgb/__1626a.html',
    });
  }
  d.push({
    id: 'krankenkasse_kind', phase: 'erste_woche', title: 'Kind bei der Krankenkasse anmelden', dueLabel: 'in den ersten Tagen', critical: false,
    office: 'Krankenkasse eines Elternteils (Familienversicherung)', documents: ['Geburtsurkunde (Ausfertigung für die Krankenkasse)'],
    why: 'Erst dann bekommt Ihr Kind eine Versichertenkarte für die U-Untersuchungen.',
  });
  if (s.motherEmployed) {
    d.push({
      id: 'mutterschaftsgeld', phase: 'erste_woche', title: 'Geburtsurkunde für das Mutterschaftsgeld einreichen', dueLabel: 'nach der Geburt', critical: false,
      office: s.motherStatutoryInsured ? 'Krankenkasse der Mutter und Arbeitgeber (Zuschuss)' : 'Bundesamt für Soziale Sicherung (Mutterschaftsgeld für privat Versicherte) und Arbeitgeber',
      documents: ['Geburtsurkunde', 'ärztliche Bescheinigung über den Entbindungstag'],
      why: `Die Schutzfrist nach der Geburt dauert ${protectionWeeks} Wochen (bis ${protectionEnd.split('-').reverse().join('.')}). Mutterschaftsgeld und Arbeitgeberzuschuss werden mit dem tatsächlichen Geburtsdatum abgerechnet.`,
      legalBasis: '§ 3 MuSchG', sourceUrl: G + 'muschg_2018/__3.html',
    });
    // Elternzeit directly after maternity protection must be requested 7 weeks before it starts.
    d.push({
      id: 'elternzeit_mutter', title: 'Elternzeit der Mutter beim Arbeitgeber anmelden (falls direkt nach dem Mutterschutz)',
      dueDate: addDays(protectionEnd, -49), dueLabel: '7 Wochen vor Beginn der Elternzeit', critical: true, phase: s.pretermOrMultiple ? 'erste_wochen' : 'erste_woche',
      office: 'Arbeitgeber (in Textform, z. B. E-Mail)', documents: ['Erklärung, für welche Zeiten in den ersten zwei Jahren Elternzeit genommen wird'],
      why: 'Soll die Elternzeit direkt an den Mutterschutz anschließen, muss sie sieben Wochen vorher verlangt werden. Die Mutterschutzzeit wird auf die Elternzeit angerechnet. Bei dringenden Gründen ist eine kürzere Frist möglich.',
      legalBasis: '§ 16 Abs. 1 BEEG', sourceUrl: G + 'beeg/__16.html',
    });
  }
  if (s.otherParentEmployed) {
    d.push({
      id: 'elternzeit_partner', title: 'Elternzeit des anderen Elternteils anmelden',
      ...(s.otherParentLeaveStart ? { dueDate: addDays(s.otherParentLeaveStart, -49) } : {}),
      dueLabel: '7 Wochen vor dem gewünschten Beginn', critical: true, phase: 'erste_wochen',
      office: 'Arbeitgeber (in Textform)', documents: ['Geburtsurkunde', 'Zeitplan der Elternzeit für zwei Jahre'],
      why: 'Wer Elternzeit will, muss sie spätestens sieben Wochen vor Beginn verlangen. Für einen Start direkt ab Geburt hätte das vor der Geburt passieren müssen; dann kurzfristig mit dem Arbeitgeber sprechen.',
      legalBasis: '§ 16 Abs. 1 BEEG', sourceUrl: G + 'beeg/__16.html',
    });
  }
  // Elterngeld: retroactive only for the 3 months of life before the month of life in which the application arrives.
  d.push({
    id: 'elterngeld', title: 'Elterngeld beantragen', dueDate: addDays(addMonths(b, 4), -1),
    dueLabel: 'spätestens im 4. Lebensmonat eingehen lassen, damit kein Monat verloren geht', critical: true, phase: 'erste_wochen',
    office: 'Elterngeldstelle Ihres Bundeslandes (in vielen Ländern online über ElterngeldDigital)',
    documents: ['Geburtsurkunde (für Elterngeld)', 'Einkommensnachweise der letzten 12 Monate', 'Bescheinigung über Mutterschaftsgeld', 'Steuer-ID'],
    why: 'Elterngeld wird höchstens drei Lebensmonate rückwirkend gezahlt. Kommt der Antrag später an, gehen die ersten Monate verloren – oft mehrere tausend Euro.',
    legalBasis: '§ 7 Abs. 1 BEEG', sourceUrl: G + 'beeg/__7.html',
  });
  d.push({
    id: 'steuerid', title: 'Steuer-ID des Kindes abwarten', dueLabel: 'kommt automatisch per Post', critical: false, phase: 'erste_wochen',
    office: 'Bundeszentralamt für Steuern (automatisch nach der Anmeldung)', documents: [],
    why: 'Die Steuer-ID brauchen Sie für den Kindergeldantrag. Sie kommt ohne Antrag nach einigen Wochen.',
  });
  d.push({
    id: 'kindergeld', title: 'Kindergeld beantragen', dueDate: endOfMonthAfter(b, 6),
    dueLabel: 'spätestens 6 Monate nach dem Geburtsmonat', critical: true, phase: 'erste_wochen',
    office: 'Familienkasse der Bundesagentur für Arbeit (online möglich)', documents: ['Steuer-ID von Kind und antragstellendem Elternteil', 'Geburtsurkunde'],
    why: 'Kindergeld wird nur für die letzten sechs Monate vor dem Antragsmonat nachgezahlt. Am besten beantragen, sobald die Steuer-ID da ist.',
    legalBasis: '§ 70 Abs. 1 EStG', sourceUrl: G + 'estg/__70.html',
  });
  if (s.singleParent) {
    d.push({
      id: 'unterhaltsvorschuss', title: 'Unterhaltsvorschuss beantragen (falls kein oder zu wenig Unterhalt kommt)', dueDate: endOfMonthAfter(b, 1),
      dueLabel: 'rückwirkend nur 1 Monat – sofort beantragen', critical: true, phase: 'erste_wochen',
      office: 'Jugendamt (Unterhaltsvorschusskasse)', documents: ['Geburtsurkunde', 'Angaben zum anderen Elternteil'],
      why: 'Der Vorschuss wird höchstens für den Monat vor dem Antrag nachgezahlt.',
      legalBasis: '§ 4 UVG', sourceUrl: G + 'uhvorschg/__4.html',
    });
  }
  if (s.lowIncome) {
    d.push({
      id: 'kinderzuschlag', title: 'Kinderzuschlag und Wohngeld prüfen', dueLabel: 'bald prüfen', critical: false, phase: 'erste_wochen',
      office: 'Familienkasse (Kinderzuschlag), Wohngeldstelle der Gemeinde', documents: ['Einkommensnachweise', 'Mietvertrag'],
      why: 'Viele Familien mit kleinem Einkommen haben Anspruch, beantragen ihn aber nicht. Ein neues Kind kann den Anspruch erst entstehen lassen.',
    });
  }
  if (s.needsChildcare) {
    d.push({
      id: 'kita', title: 'Kita- oder Tagespflegeplatz anmelden', dueDate: addMonths(addMonths(b, 12), -6),
      dueLabel: 'Richtwert: 6 Monate vor dem gewünschten Start (Fristen der Kommune prüfen)', critical: false, phase: 'spaeter',
      office: 'Jugendamt bzw. Kita-Portal Ihrer Stadt', documents: ['Geburtsurkunde', 'ggf. Arbeitgeberbescheinigungen'],
      why: 'Ab dem ersten Geburtstag gibt es einen Rechtsanspruch auf einen Platz. Viele Kommunen verlangen eine Anmeldung Monate im Voraus.',
      legalBasis: '§ 24 SGB VIII', sourceUrl: G + 'sgb_8/__24.html',
    });
  }

  const steps: Step[] = d.map((x) => {
    const daysLeft = x.dueDate ? daysBetween(today, x.dueDate) : undefined;
    return { ...x, overdue: daysLeft !== undefined && daysLeft < 0, ...(daysLeft !== undefined ? { daysLeft } : {}) };
  });
  const order: Record<Step['phase'], number> = { sofort: 0, erste_woche: 1, erste_wochen: 2, spaeter: 3 };
  steps.sort((x, y) => order[x.phase] - order[y.phase] || (x.dueDate ?? '9999').localeCompare(y.dueDate ?? '9999'));
  const nextDeadline = steps
    .filter((x) => x.daysLeft !== undefined && !x.overdue && x.critical)
    .sort((x, y) => (x.daysLeft ?? 0) - (y.daysLeft ?? 0))[0];

  return {
    rulesVersion: RULES_VERSION,
    today,
    heading: 'Willkommen, kleiner Mensch – was jetzt zu erledigen ist',
    intro: 'Herzlichen Glückwunsch! Die meisten Anträge haben etwas Zeit. Ein paar Fristen sind aber wichtig, weil sonst Geld verloren geht. Hier sehen Sie, was wann dran ist.',
    anchorLabel: `Geburtstag ${b.split('-').reverse().join('.')}`,
    phaseSet: 'geburt',
    ...(nextDeadline ? { nextDeadline } : {}),
    steps,
    support:
      'Fragen, Erschöpfung oder Sorgen? Ihre Hebamme hilft, ebenso das Elterntelefon der Nummer gegen Kummer: 0800 111 0 550 (kostenfrei, anonym).',
    disclaimer:
      `Regelbasierter Fahrplan mit bundesweiten Fristen (Regelwerk ${RULES_VERSION}). Verfahren der Länder und Kommunen können abweichen. Keine Rechts- oder Steuerberatung.`,
  };
}
