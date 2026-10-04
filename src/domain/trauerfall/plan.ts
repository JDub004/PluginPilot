import { addDays, addMonths, daysBetween, endOfMonthAfter, nthWerktagAfter, parseIso } from './calendar.js';
import type { Plan, Situation, Step } from './schema.js';

export const RULES_VERSION = '2026.10.0';

export const SUPPORT =
  'Sie müssen das nicht allein schaffen. TelefonSeelsorge, rund um die Uhr und kostenfrei: 0800 111 0 111 oder 0800 111 0 222.';

export const DISCLAIMER =
  'Regelbasierter Fahrplan mit bundesweit geltenden Fristen (Stand Regelwerk ' +
  RULES_VERSION +
  '). Landesrecht (z. B. Bestattungsfristen) und Einzelfälle können abweichen. Keine Rechtsberatung. Bei Erbfragen: Nachlassgericht, Notar oder Anwalt.';

export class InvalidSituationError extends Error {}

type Draft = Omit<Step, 'daysLeft' | 'overdue' | 'phase'> & { phase?: Step['phase'] };

/** Builds the personal step plan after a death. Pure function: `today` is injected. */
export function planAfterDeath(s: Situation, today: string): Plan {
  parseIso(s.dateOfDeath);
  if (s.dateOfDeath > today) throw new InvalidSituationError('Das Sterbedatum liegt in der Zukunft.');
  if (daysBetween(s.dateOfDeath, today) > 5 * 366) throw new InvalidSituationError('Das Sterbedatum liegt mehr als fünf Jahre zurück.');
  const known = s.knowledgeDate ?? s.dateOfDeath;
  parseIso(known);
  if (known < s.dateOfDeath) throw new InvalidSituationError('Das Kenntnisdatum liegt vor dem Sterbedatum.');

  const d = s.dateOfDeath;
  const drafts: Draft[] = [];

  // --- immediately -------------------------------------------------------------------------
  if (s.placeOfDeath === 'home') {
    drafts.push({
      id: 'leichenschau', title: 'Ärztin oder Arzt für die Leichenschau rufen', dueDate: d, dueLabel: 'sofort', critical: true,
      office: 'Hausarzt, ärztlicher Bereitschaftsdienst 116117 (bei Unklarheit 112)',
      documents: ['Personalausweis der verstorbenen Person', 'Krankenversichertenkarte'],
      why: 'Erst mit der Todesbescheinigung (Totenschein) können Bestattung und Beurkundung beginnen.',
      legalBasis: 'Bestattungsgesetz des Landes',
    });
  }
  if (s.placeOfDeath === 'abroad') {
    drafts.push({
      id: 'ausland', title: 'Deutsche Auslandsvertretung kontaktieren und Überführung klären', dueDate: d, dueLabel: 'sofort', critical: true,
      office: 'Deutsche Botschaft oder Konsulat im Sterbeland; Bestatter mit Auslandserfahrung',
      documents: ['Ausländische Sterbeurkunde', 'Reisepass oder Personalausweis'],
      why: 'Die Vertretung hilft bei Dokumenten und Überführung. Der Sterbefall kann später auch beim Standesamt in Deutschland nachbeurkundet werden.',
    });
  }
  drafts.push({
    id: 'bestatter', title: 'Bestattungsunternehmen beauftragen', dueDate: d, dueLabel: 'sofort', critical: false,
    office: 'Bestatter Ihrer Wahl (Angebote vergleichen ist erlaubt)',
    documents: ['Todesbescheinigung', 'Personalausweis', 'Geburts- bzw. Heiratsurkunde', 'ggf. Bestattungsverfügung'],
    why: 'Der Bestatter übernimmt auf Wunsch Überführung, Behördengänge und kennt die Bestattungsfristen Ihres Bundeslandes.',
    legalBasis: 'Bestattungsgesetz des Landes',
  });
  if (s.hasLifeInsurance) {
    drafts.push({
      id: 'lebensversicherung', title: 'Lebens- oder Sterbegeldversicherung informieren', dueDate: addDays(d, 3),
      dueLabel: 'unverzüglich (Verträge verlangen oft 24–72 Stunden)', critical: true,
      office: 'Versicherungsgesellschaft', documents: ['Versicherungsschein', 'Sterbeurkunde (nachreichen)'],
      why: 'Verspätete Meldung kann die Auszahlung verzögern oder gefährden. Prüfen Sie die Frist im Vertrag.',
    });
  }

  // --- first week --------------------------------------------------------------------------
  if (s.placeOfDeath !== 'abroad') {
    drafts.push({
      id: 'standesamt', title: 'Sterbefall beim Standesamt anzeigen und Sterbeurkunden bestellen', dueDate: nthWerktagAfter(d, 3),
      dueLabel: 'spätestens am 3. Werktag nach dem Tod', critical: true,
      office: 'Standesamt des Sterbeortes (Krankenhaus/Heim oder Bestatter erledigen das oft)',
      documents: ['Todesbescheinigung', 'Personalausweis', 'Geburtsurkunde', 'ggf. Heirats-/Scheidungsurkunde'],
      why: 'Die Sterbeurkunde brauchen Sie für fast jeden weiteren Schritt. Bestellen Sie gleich mehrere Exemplare.',
      legalBasis: '§ 28 PStG', sourceUrl: 'https://www.gesetze-im-internet.de/pstg/__28.html',
    });
  }
  if (s.willFound) {
    drafts.push({
      id: 'testament', letterType: 'testament_ablieferung', title: 'Gefundenes Testament beim Nachlassgericht abliefern', dueLabel: 'unverzüglich', critical: true,
      office: 'Nachlassgericht (Amtsgericht am letzten Wohnsitz)', documents: ['Original-Testament', 'Sterbeurkunde'],
      why: 'Wer ein Testament findet, muss es abliefern, auch wenn es ihn nicht begünstigt. Das Gericht eröffnet es.',
      legalBasis: '§ 2259 BGB', sourceUrl: 'https://www.gesetze-im-internet.de/bgb/__2259.html',
    });
  }
  if (s.deceasedEmployed) {
    drafts.push({
      id: 'arbeitgeber', letterType: 'arbeitgeber_mitteilung', title: 'Arbeitgeber informieren', dueLabel: 'in der ersten Woche', phase: 'erste_woche', critical: false,
      office: 'Personalabteilung', documents: ['Sterbeurkunde'],
      why: 'Restlohn, Urlaubsabgeltung und ggf. tarifliches Sterbegeld klären.',
    });
  }
  if (s.deceasedCivilServant) {
    drafts.push({
      id: 'dienstherr', title: 'Dienstherrn bzw. Versorgungsstelle informieren', dueLabel: 'in der ersten Woche', phase: 'erste_woche', critical: true,
      office: 'Dienststelle / Versorgungsamt', documents: ['Sterbeurkunde'],
      why: 'Hinterbliebene erhalten Sterbegeld und Hinterbliebenenversorgung nach Beamtenrecht.',
      legalBasis: 'BeamtVG bzw. Landesbeamtenversorgungsgesetz',
    });
  }
  if (s.receivedCareBenefits) {
    drafts.push({
      id: 'pflegekasse', title: 'Pflegekasse und Pflegedienst informieren', dueLabel: 'in der ersten Woche', phase: 'erste_woche', critical: false,
      office: 'Pflegekasse (bei der Krankenkasse)', documents: ['Sterbeurkunde'],
      why: 'Pflegeleistungen enden mit dem Todestag. Zu viel Gezahltes wird zurückgefordert.',
    });
  }

  // --- first weeks: deadlines ----------------------------------------------------------------
  if (s.survivingSpouse && s.deceasedReceivedPension) {
    drafts.push({
      id: 'sterbevierteljahr', title: 'Vorschuss für das Sterbevierteljahr beantragen', dueDate: addDays(d, 30),
      dueLabel: 'innerhalb von 30 Tagen nach dem Tod', critical: true,
      office: 'Renten Service der Deutschen Post (Antrag auch über Bestatter oder Rentenversicherung)',
      documents: ['Sterbeurkunde', 'Rentennummer der verstorbenen Person', 'Ihre Bankverbindung'],
      why: 'Für drei Monate nach dem Sterbemonat wird die volle Rente der verstorbenen Person als Vorschuss weitergezahlt. Der Antrag muss innerhalb von 30 Tagen gestellt werden.',
      legalBasis: 'Sterbevierteljahr; Vorschuss nur bei Antrag innerhalb von 30 Tagen (Deutsche Rentenversicherung)', sourceUrl: 'https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2025/251007-sterbevierteljahr-vorschuss.html',
    });
  }
  if (s.survivingSpouseFamilyInsured) {
    drafts.push({
      id: 'krankenversicherung', letterType: 'krankenkasse_beitritt', title: 'Eigene Krankenversicherung klären (freiwillige Versicherung)', dueDate: addMonths(d, 3),
      dueLabel: 'innerhalb von 3 Monaten', critical: true,
      office: 'Krankenkasse', documents: ['Sterbeurkunde', 'Versichertenkarte'],
      why: 'Die Familienversicherung endet. Der Beitritt zur freiwilligen Versicherung ist nur innerhalb von drei Monaten möglich.',
      legalBasis: '§ 9 Abs. 2 SGB V', sourceUrl: 'https://www.gesetze-im-internet.de/sgb_5/__9.html',
    });
  }
  if (s.rentedApartment) {
    drafts.push(
      s.livedTogether
        ? {
            id: 'mietvertrag', letterType: 'mietvertrag_nicht_fortsetzen', title: 'Entscheiden, ob Sie den Mietvertrag fortführen', dueDate: addMonths(known, 1),
            dueLabel: 'innerhalb eines Monats ab Kenntnis', critical: true,
            office: 'Vermieter (schriftlich)', documents: ['Sterbeurkunde', 'Mietvertrag'],
            why: 'Wer im Haushalt lebte, tritt automatisch in den Mietvertrag ein. Wer das nicht will, muss es innerhalb eines Monats erklären.',
            legalBasis: '§ 563 Abs. 3 BGB', sourceUrl: 'https://www.gesetze-im-internet.de/bgb/__563.html',
          }
        : {
            id: 'mietvertrag', letterType: 'mietvertrag_kuendigung_erben', title: 'Mietwohnung mit Sonderkündigungsrecht kündigen', dueDate: addMonths(known, 1),
            dueLabel: 'innerhalb eines Monats ab Kenntnis', critical: true,
            office: 'Vermieter (schriftlich, von allen Erben unterschrieben)', documents: ['Sterbeurkunde', 'Mietvertrag', 'ggf. Erbnachweis'],
            why: 'Erben können außerordentlich mit der gesetzlichen Frist (3 Monate) kündigen, aber nur innerhalb eines Monats. Danach läuft der Vertrag regulär weiter.',
            legalBasis: '§ 564 BGB', sourceUrl: 'https://www.gesetze-im-internet.de/bgb/__564.html',
          },
    );
  }
  const ausschlagungDue = s.deceasedLivedAbroad ? addMonths(known, 6) : addDays(known, 42);
  drafts.push({
    id: 'ausschlagung',
    title: s.debtsSuspected ? 'Erbausschlagung prüfen: Schulden im Nachlass vermutet' : 'Frist für eine Erbausschlagung kennen',
    dueDate: ausschlagungDue,
    dueLabel: s.deceasedLivedAbroad ? '6 Monate ab Kenntnis' : '6 Wochen ab Kenntnis',
    critical: s.debtsSuspected,
    office: 'Nachlassgericht (Amtsgericht) oder Notar, persönlich bzw. öffentlich beglaubigt',
    documents: ['Personalausweis', 'Sterbeurkunde', 'Angaben zum Nachlass'],
    why: (s.debtsSuspected
      ? 'Wer nicht rechtzeitig ausschlägt, hat das Erbe angenommen und haftet grundsätzlich auch für Schulden. Nicht über Nachlassgegenstände verfügen, bevor das geklärt ist.'
      : 'Nach Ablauf gilt das Erbe als angenommen. Nur relevant, wenn Sie das Erbe nicht wollen, etwa bei Schulden.') +
      (s.willFound ? ' Weil ein Testament vorliegt, beginnt die Frist erst, wenn das Nachlassgericht es Ihnen bekannt gegeben hat; das Datum hier ist die früheste Möglichkeit.' : '') +
      ' Halten Sie sich bei Beginn der Frist im Ausland auf, beträgt sie sechs Monate.',
    legalBasis: '§§ 1943, 1944, 1945 BGB', sourceUrl: 'https://www.gesetze-im-internet.de/bgb/__1944.html',
  });
  if (s.survivingSpouse) {
    drafts.push({
      id: 'witwenrente', phase: 'erste_wochen', title: 'Witwen- bzw. Witwerrente beantragen', dueDate: endOfMonthAfter(d, 12),
      dueLabel: 'spätestens 12 Kalendermonate nach dem Sterbemonat, besser sofort', critical: true,
      office: 'Deutsche Rentenversicherung (Auskunfts- und Beratungsstelle, Versichertenälteste oder online)',
      documents: ['Sterbeurkunde', 'Heiratsurkunde', 'Rentenversicherungsnummern', 'Einkommensnachweise'],
      why: 'Die Rente wird höchstens 12 Kalendermonate rückwirkend gezahlt. Ein späterer Antrag kostet Geld.',
      legalBasis: '§ 46, § 99 Abs. 2 SGB VI', sourceUrl: 'https://www.gesetze-im-internet.de/sgb_6/__99.html',
    });
  }
  if (s.childrenUnder27) {
    drafts.push({
      id: 'waisenrente', phase: 'erste_wochen', title: 'Waisenrente für Kinder prüfen und beantragen', dueDate: endOfMonthAfter(d, 12),
      dueLabel: 'spätestens 12 Kalendermonate nach dem Sterbemonat', critical: true,
      office: 'Deutsche Rentenversicherung', documents: ['Sterbeurkunde', 'Geburtsurkunden der Kinder', 'ggf. Schul-/Ausbildungsnachweis (ab 18)'],
      why: 'Kinder bis 18, in Ausbildung bis 27, können Waisenrente erhalten. Auch hier gilt die 12-Monats-Grenze für Nachzahlungen.',
      legalBasis: '§ 48, § 99 Abs. 2 SGB VI', sourceUrl: 'https://www.gesetze-im-internet.de/sgb_6/__99.html',
    });
  }
  drafts.push({
    id: 'erbschaftsteuer', title: 'Erbschaft dem Finanzamt anzeigen (falls nötig)', dueDate: addMonths(known, 3),
    dueLabel: 'innerhalb von 3 Monaten ab Kenntnis', critical: false,
    office: 'Erbschaftsteuer-Finanzamt', documents: ['Sterbeurkunde', 'Übersicht über den Nachlass'],
    why: 'Die Anzeige entfällt, wenn ein Testament gerichtlich oder notariell eröffnet wurde und sich Ihr Verhältnis zur verstorbenen Person daraus eindeutig ergibt. Sie bleibt aber nötig, wenn Grundbesitz, Betriebsvermögen, bestimmte Firmenanteile oder Auslandsvermögen dazugehören.',
    legalBasis: '§ 30 ErbStG', sourceUrl: 'https://www.gesetze-im-internet.de/erbstg_1974/__30.html',
  });

  // --- later ---------------------------------------------------------------------------------
  drafts.push({
    id: 'banken', letterType: 'bank_mitteilung', title: 'Banken informieren und Erbnachweis klären', dueLabel: 'in den ersten Wochen', phase: 'erste_wochen', critical: false,
    office: 'Banken und Sparkassen der verstorbenen Person', documents: ['Sterbeurkunde', 'Erbschein oder eröffnetes notarielles Testament', 'ggf. Vollmacht über den Tod hinaus'],
    why: 'Daueraufträge prüfen, Bestattungskosten können oft direkt vom Konto bezahlt werden.',
  });
  if (s.ownedVehicle) {
    drafts.push({
      id: 'fahrzeug', title: 'Fahrzeug: Versicherung informieren, umschreiben oder abmelden', dueLabel: 'in den ersten Wochen', phase: 'erste_wochen', critical: false,
      office: 'Kfz-Versicherung, Zulassungsstelle', documents: ['Zulassungsbescheinigung Teil I und II', 'Sterbeurkunde', 'Erbnachweis'],
      why: 'Versicherung und Kfz-Steuer laufen sonst weiter.',
    });
  }
  if (s.deceasedSelfEmployed) {
    drafts.push({
      id: 'gewerbe', title: 'Gewerbe abmelden und Finanzamt informieren', dueLabel: 'in den ersten Wochen', phase: 'erste_wochen', critical: false,
      office: 'Gewerbeamt, Finanzamt', documents: ['Sterbeurkunde', 'Gewerbeanmeldung'],
      why: 'Mit der Aufgabe des Betriebs ist das Gewerbe abzumelden.',
      legalBasis: '§ 14 GewO', sourceUrl: 'https://www.gesetze-im-internet.de/gewo/__14.html',
    });
  }
  drafts.push({
    id: 'rundfunk', letterType: 'rundfunk_abmeldung', title: 'Rundfunkbeitrag abmelden', dueLabel: 'in den ersten Wochen', phase: 'erste_wochen', critical: false,
    office: 'ARD ZDF Deutschlandradio Beitragsservice (online)', documents: ['Beitragsnummer', 'Sterbeurkunde'],
    why: 'Der Beitrag wird sonst weiter abgebucht.',
  });
  drafts.push({
    id: 'vertraege', letterType: 'vertrag_kuendigung', title: 'Verträge, Mitgliedschaften und Online-Konten kündigen', dueLabel: 'später, ohne Eile', phase: 'spaeter', critical: false,
    office: 'Telefon/Internet, Strom, Abos, Vereine, E-Mail und soziale Netzwerke', documents: ['Sterbeurkunde'],
    why: 'Viele Verträge enden nicht automatisch. Bei Online-Konten gibt es oft eigene Verfahren für Hinterbliebene.',
  });
  drafts.push({
    id: 'steuererklaerung', title: 'Einkommensteuererklärung für das Todesjahr (falls Pflicht)', dueDate: `${parseIso(d).getUTCFullYear() + 1}-07-31`,
    dueLabel: 'falls Pflicht: bis 31.07. des Folgejahres', critical: false,
    office: 'Finanzamt der verstorbenen Person', documents: ['Einkommensnachweise', 'Belege zu Bestattungskosten'],
    why: 'Die Erben müssen die letzte Erklärung abgeben. Mit Steuerberatung gelten längere Fristen.',
    legalBasis: '§ 149 AO', sourceUrl: 'https://www.gesetze-im-internet.de/ao_1977/__149.html',
  });

  const steps = drafts.map((x) => finish(x, today, d)).sort(order);
  const nextDeadline = steps
    .filter((x) => x.daysLeft !== undefined && !x.overdue && x.critical)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0];
  return {
    rulesVersion: RULES_VERSION,
    today,
    heading: 'Schritt für Schritt – was jetzt zu tun ist',
    intro: 'Es tut uns sehr leid. Sie müssen nicht alles auf einmal erledigen. Vieles übernimmt auf Wunsch der Bestatter. Hier sehen Sie, was wann wichtig ist.',
    anchorLabel: `Todestag ${d.split('-').reverse().join('.')}`,
    dateOfDeath: d,
    ...(nextDeadline ? { nextDeadline } : {}),
    steps,
    support: SUPPORT,
    disclaimer: DISCLAIMER,
  };
}

function finish(x: Draft, today: string, death: string): Step {
  // "sofort" steps are actions, not deadlines: never shown as overdue.
  const daysLeft = x.dueDate && x.dueLabel !== 'sofort' ? daysBetween(today, x.dueDate) : undefined;
  const phase: Step['phase'] =
    x.phase ??
    (x.dueLabel === 'sofort' || x.dueLabel.startsWith('unverzüglich')
      ? 'sofort'
      : x.dueDate && daysBetween(death, x.dueDate) <= 7
        ? 'erste_woche'
        : x.dueDate && daysBetween(death, x.dueDate) <= 120
          ? 'erste_wochen'
          : 'spaeter');
  return { ...x, phase, overdue: daysLeft !== undefined && daysLeft < 0, ...(daysLeft !== undefined ? { daysLeft } : {}) };
}

const PHASE_ORDER: Record<Step['phase'], number> = { sofort: 0, erste_woche: 1, erste_wochen: 2, spaeter: 3 };
function order(a: Step, b: Step): number {
  return PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || Number(b.critical) - Number(a.critical);
}
