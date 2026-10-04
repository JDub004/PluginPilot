import { addDays, tenancyEndAfterNotice } from './calendar.js';

export const LETTER_TYPES = [
  'mietvertrag_kuendigung_erben',
  'mietvertrag_nicht_fortsetzen',
  'vertrag_kuendigung',
  'rundfunk_abmeldung',
  'bank_mitteilung',
  'krankenkasse_beitritt',
  'arbeitgeber_mitteilung',
  'testament_ablieferung',
] as const;
export type LetterType = (typeof LETTER_TYPES)[number];

export interface LetterInput {
  type: LetterType;
  today: string;
  dateOfDeath: string;
  deceasedName?: string;
  senderName?: string;
  senderAddress?: string;
  recipient?: string;
  reference?: string;
  relationship?: string;
  contractName?: string;
}

export type Letter = {
  type: LetterType;
  subject: string;
  recipientHint: string;
  body: string;
  attachments: string[];
  sendHint: string;
  computed?: { label: string; date: string };
};

const fmt = (d: string) => d.split('-').reverse().join('.');

/** Fills a letter template. Missing personal data stays as a visible [placeholder]. */
export function draftLetter(i: LetterInput): Letter {
  const name = i.senderName ?? '[Ihr Name]';
  const addr = i.senderAddress ?? '[Ihre Anschrift]';
  const dec = i.deceasedName ?? '[Name der verstorbenen Person]';
  const ref = i.reference ? ` (${i.reference})` : ' ([Vertrags-/Kundennummer])';
  const died = `${dec}, verstorben am ${fmt(i.dateOfDeath)}`;
  const head = `${name}\n${addr}\n\n${i.recipient ?? '[Empfänger]'}\n\n${fmt(i.today)}\n\n`;
  const close = `\n\nMit freundlichen Grüßen\n\n${name}`;

  switch (i.type) {
    case 'mietvertrag_kuendigung_erben': {
      // If posted today, assume receipt in 3 days (conservative).
      const end = tenancyEndAfterNotice(addDays(i.today, 3));
      return {
        type: i.type,
        subject: `Außerordentliche Kündigung des Mietvertrags${ref} nach § 564 BGB`,
        recipientHint: 'Vermieter bzw. Hausverwaltung',
        body: `${head}Betreff: Außerordentliche Kündigung des Mietvertrags${ref}\n\nSehr geehrte Damen und Herren,\n\nder Mieter/die Mieterin ${died}. Als Erbe/Erbin kündige ich hiermit das Mietverhältnis über die Wohnung [Anschrift der Wohnung] außerordentlich mit der gesetzlichen Frist gemäß § 564 BGB, also zum ${fmt(end)}, hilfsweise zum nächstmöglichen Termin.\n\nBitte bestätigen Sie mir den Eingang und das Mietende schriftlich. Für die Wohnungsübergabe und die Rückzahlung der Kaution melde ich mich gern bei Ihnen.\n\nEine Kopie der Sterbeurkunde liegt bei.${close}`,
        attachments: ['Kopie der Sterbeurkunde', 'ggf. Erbnachweis'],
        sendHint: 'Per Einschreiben senden. Sind mehrere Erben vorhanden, müssen alle unterschreiben. Die Kündigung muss innerhalb eines Monats ab Kenntnis zugehen.',
        computed: { label: 'Voraussichtliches Mietende bei Zugang in 3 Tagen', date: end },
      };
    }
    case 'mietvertrag_nicht_fortsetzen':
      return {
        type: i.type,
        subject: `Erklärung nach § 563 Abs. 3 BGB zum Mietvertrag${ref}`,
        recipientHint: 'Vermieter bzw. Hausverwaltung',
        body: `${head}Betreff: Erklärung nach § 563 Abs. 3 BGB\n\nSehr geehrte Damen und Herren,\n\nder Mieter/die Mieterin ${died}. Ich habe mit ihm/ihr einen gemeinsamen Haushalt geführt. Hiermit erkläre ich gemäß § 563 Abs. 3 BGB, dass ich das Mietverhältnis über die Wohnung [Anschrift der Wohnung] nicht fortsetzen möchte.\n\nBitte bestätigen Sie mir den Eingang dieser Erklärung schriftlich.${close}`,
        attachments: ['Kopie der Sterbeurkunde'],
        sendHint: 'Per Einschreiben senden. Die Erklärung muss innerhalb eines Monats ab Kenntnis vom Tod zugehen. Wenn Sie in der Wohnung bleiben möchten, brauchen Sie diesen Brief nicht.',
      };
    case 'vertrag_kuendigung':
      return {
        type: i.type,
        subject: `Kündigung ${i.contractName ?? 'des Vertrags'}${ref} wegen Todesfall`,
        recipientHint: 'Anbieter (Telefon, Internet, Strom, Zeitschrift, Verein, Fitnessstudio …)',
        body: `${head}Betreff: Kündigung wegen Todesfall${ref}\n\nSehr geehrte Damen und Herren,\n\nIhr Kunde/Ihre Kundin ${died}. Als ${i.relationship ?? 'Angehörige/r bzw. Erbe/Erbin'} kündige ich ${i.contractName ?? 'den Vertrag'} zum nächstmöglichen Zeitpunkt, wenn möglich mit Wirkung zum Todestag. Bitte stellen Sie Abbuchungen ein und erstatten Sie zu viel gezahlte Beträge auf das bisherige Konto.\n\nBitte bestätigen Sie mir die Kündigung schriftlich. Eine Kopie der Sterbeurkunde liegt bei.${close}`,
        attachments: ['Kopie der Sterbeurkunde'],
        sendHint: 'Viele Anbieter haben ein Formular für Todesfälle. Ein Sonderkündigungsrecht hängt vom Vertrag ab; manche Verträge gehen auf die Erben über.',
      };
    case 'rundfunk_abmeldung':
      return {
        type: i.type,
        subject: `Abmeldung vom Rundfunkbeitrag wegen Todesfall${ref}`,
        recipientHint: 'ARD ZDF Deutschlandradio Beitragsservice, 50656 Köln (oder online unter rundfunkbeitrag.de)',
        body: `${head}Betreff: Abmeldung wegen Todesfall, Beitragsnummer${ref}\n\nSehr geehrte Damen und Herren,\n\nder Beitragszahler/die Beitragszahlerin ${died}. Ich bitte um Abmeldung der Wohnung zum Ende des Sterbemonats und um Erstattung zu viel gezahlter Beiträge.${close}`,
        attachments: ['Kopie der Sterbeurkunde'],
        sendHint: 'Am schnellsten über das Online-Formular "Abmelden" auf rundfunkbeitrag.de.',
      };
    case 'bank_mitteilung':
      return {
        type: i.type,
        subject: `Mitteilung über einen Todesfall${ref}`,
        recipientHint: 'Bank oder Sparkasse der verstorbenen Person',
        body: `${head}Betreff: Todesfall, Konto${ref}\n\nSehr geehrte Damen und Herren,\n\nich teile Ihnen mit, dass Ihr Kunde/Ihre Kundin ${died}. Bitte teilen Sie mir mit, welche Unterlagen Sie für den Zugriff der Erben benötigen, und prüfen Sie bestehende Daueraufträge und Lastschriften.\n\nRechnungen für die Bestattung möchte ich, soweit möglich, direkt vom Konto begleichen lassen.${close}`,
        attachments: ['Kopie der Sterbeurkunde', 'ggf. Vollmacht über den Tod hinaus', 'später: Erbschein oder eröffnetes notarielles Testament'],
        sendHint: 'Ein persönlicher Termin ist oft am einfachsten. Verfügen Sie nicht über das Konto, solange eine Erbausschlagung in Frage kommt.',
      };
    case 'krankenkasse_beitritt':
      return {
        type: i.type,
        subject: 'Beitritt zur freiwilligen Krankenversicherung nach § 9 Abs. 1 Nr. 2 SGB V',
        recipientHint: 'Ihre bisherige Krankenkasse',
        body: `${head}Betreff: Beitritt zur freiwilligen Versicherung, Versichertennummer${ref}\n\nSehr geehrte Damen und Herren,\n\nich war über meinen Ehepartner/meine Ehepartnerin familienversichert. Er/Sie ${dec === '[Name der verstorbenen Person]' ? 'ist' : `(${dec}) ist`} am ${fmt(i.dateOfDeath)} verstorben. Hiermit erkläre ich meinen Beitritt zur freiwilligen Krankenversicherung nach § 9 Abs. 1 Nr. 2 SGB V und bitte um Bestätigung sowie um Information zu den Beiträgen. Bitte prüfen Sie auch, ob eine andere Versicherung (z. B. Krankenversicherung der Rentner) für mich in Frage kommt.${close}`,
        attachments: ['Kopie der Sterbeurkunde'],
        sendHint: 'Der Beitritt muss innerhalb von drei Monaten angezeigt werden (§ 9 Abs. 2 SGB V).',
      };
    case 'arbeitgeber_mitteilung':
      return {
        type: i.type,
        subject: 'Mitteilung über den Tod Ihres Mitarbeiters/Ihrer Mitarbeiterin',
        recipientHint: 'Personalabteilung des Arbeitgebers',
        body: `${head}Betreff: Todesfall\n\nSehr geehrte Damen und Herren,\n\nich muss Ihnen mitteilen, dass Ihr Mitarbeiter/Ihre Mitarbeiterin ${died}. Bitte teilen Sie mir mit, welche Ansprüche noch bestehen (Restgehalt, Urlaubsabgeltung, tarifliches oder betriebliches Sterbegeld, betriebliche Altersversorgung) und welche Unterlagen Sie benötigen.${close}`,
        attachments: ['Kopie der Sterbeurkunde'],
        sendHint: 'Fragen Sie auch nach persönlichen Gegenständen am Arbeitsplatz.',
      };
    case 'testament_ablieferung':
      return {
        type: i.type,
        subject: 'Ablieferung eines Testaments nach § 2259 BGB',
        recipientHint: 'Nachlassgericht (Amtsgericht am letzten Wohnsitz der verstorbenen Person)',
        body: `${head}Betreff: Ablieferung eines Testaments, Nachlasssache ${dec}\n\nSehr geehrte Damen und Herren,\n\n${died}. Anbei übergebe ich das aufgefundene Testament im Original gemäß § 2259 BGB mit der Bitte um Eröffnung.${close}`,
        attachments: ['Original-Testament (nicht öffnen, nicht verändern)', 'Kopie der Sterbeurkunde'],
        sendHint: 'Am sichersten persönlich beim Nachlassgericht abgeben oder per Einschreiben mit Rückschein. Behalten Sie eine Kopie.',
      };
  }
}
