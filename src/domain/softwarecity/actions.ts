import type { AppInput, Person, Quest } from './schema.js';

type App = AppInput & { id: string };
export interface QuestAction { label: string; draft: string }

const eur = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`;
const names = (apps: App[]) => apps.map((a) => a.name).join(', ');

/**
 * Ready-to-use next step for each quest: an e-mail or checklist the user can copy instead of writing it.
 * Deterministic templates; placeholders in [brackets] are left for the user.
 */
export function actionFor(q: Quest, apps: App[], people: Person[], company: string): QuestAction {
  const list = q.buildingIds.map((id) => apps.find((a) => a.id === id)).filter((a): a is App => !!a);
  const a = list[0];
  const contact = (app?: App) => {
    const p = people.find((x) => app && x.buildingIds.includes(app.id));
    return p ? `${p.name}${p.role ? ` (${p.role})` : ''}` : app?.owner ?? '[Verantwortliche Person]';
  };
  const sign = `Viele Grüße\n[Name]\n${company}`;
  switch (q.kind) {
    case 'duplicate': {
      const keep = [...list].sort((x, y) => (y.users ?? 0) - (x.users ?? 0))[0];
      const drop = list.filter((x) => x !== keep);
      return { label: 'Rundmail: auf ein Tool umstellen', draft:
        `Betreff: Wir bündeln ${names(list)} in ${keep?.name}\n\nHallo zusammen,\n\nwir nutzen derzeit ${list.length} Programme für denselben Zweck (${names(list)}). ` +
        `Ab [Datum] arbeiten wir nur noch mit ${keep?.name}. Bitte übertragt bis dahin eure Daten aus ${names(drop)} und meldet Funktionen, die euch in ${keep?.name} fehlen, an ${contact(keep)}.\n\n` +
        `Danach kündigen wir ${names(drop)}${q.savingEurYear ? ` und sparen rund ${eur(q.savingEurYear)} pro Jahr` : ''}.\n\n${sign}` };
    }
    case 'unused_licenses':
      return { label: 'Anfrage: Lizenzen reduzieren', draft:
        `Betreff: Reduzierung unserer ${a?.name}-Lizenzen\n\nSehr geehrte Damen und Herren,\n\nwir nutzen derzeit ${a?.licenses} Lizenzen von ${a?.name}, benötigen aber nur ${a?.users}. ` +
        `Bitte reduzieren Sie unseren Vertrag (Kundennummer [Nummer]) zum nächstmöglichen Zeitpunkt auf ${a?.users} Lizenzen und bestätigen Sie uns Termin und neuen Preis schriftlich.\n\n${sign}` };
    case 'critical_spreadsheet':
      return { label: 'Checkliste: Tabelle absichern', draft:
        `Checkliste für ${a?.name} (zuständig: ${contact(a)})\n[ ] Ablageort mit automatischem Backup und Versionsverlauf (z. B. SharePoint/OneDrive) statt lokal oder per Mail\n` +
        `[ ] Schreibrechte nur für die nötigen Personen, alle anderen nur lesen\n[ ] Verantwortliche Person und Vertretung festlegen\n[ ] Prüfen, ob die Daten in ein vorhandenes System gehören (z. B. CRM/ERP)\n[ ] Termin für die Umstellung: [Datum]` };
    case 'no_owner':
      return { label: 'Nachricht: Verantwortliche benennen', draft:
        `Betreff: Wer ist verantwortlich für ${a?.name}?\n\nHallo,\n\nfür ${a?.name} ist niemand als verantwortlich eingetragen${a?.critical ? ', obwohl das Programm geschäftskritisch ist' : ''}. ` +
        `Die verantwortliche Person kümmert sich um Zugänge (neue und ausscheidende Mitarbeitende), Updates, Kosten und Kündigung.\n\nVorschlag: [Name] übernimmt, Vertretung [Name]. Bitte bis [Datum] bestätigen.\n\n${sign}` };
    case 'shadow_it':
      return { label: 'Nachricht: Freigabe nachholen', draft:
        `Betreff: ${a?.name} – Freigabe und Datenschutz klären\n\nHallo,\n\n${a?.name} wird bei uns genutzt, wurde aber nicht offiziell freigegeben. Bitte klärt bis [Datum]:\n` +
        `1. Welche Daten liegen darin (Kunden-, Personal-, Finanzdaten)?\n2. Gibt es einen Auftragsverarbeitungsvertrag (AVV) mit dem Anbieter, und wo werden die Daten gespeichert?\n` +
        `3. Wer bezahlt das Tool und wer verwaltet die Zugänge?\n4. Gibt es ein freigegebenes Programm, das dasselbe kann?\n\nDanach entscheiden wir: freigeben oder ablösen.\n\n${sign}` };
    case 'data_island':
      return { label: 'Notiz: Schnittstelle prüfen', draft:
        `${a?.name}: Welche Daten werden heute von Hand in andere Programme übertragen (abtippen, Export/Import)?\nWie oft und wie lange dauert das pro Monat? [Stunden]\n` +
        `Gibt es eine fertige Schnittstelle oder einen Konnektor des Anbieters (Marktplatz/Integrationen prüfen)?\nAnsprechpartner: ${contact(a)}` };
    case 'unknown_flow':
      return { label: 'Rückfrage: unbekanntes Ziel', draft:
        `Hallo ${contact(a)},\n\nlaut unserer Übersicht schickt ${a?.name} Daten an ein Ziel, das nicht in unserer Programmliste steht (${q.detail.match(/an (.*), das/)?.[1] ?? '[Ziel]'}). ` +
        `Ist das ein internes Programm, ein externer Dienstleister oder fehlt es in der Liste? Danke!\n\n${sign}` };
    case 'key_person':
      return { label: 'Checkliste: Vertretung organisieren', draft:
        `Vertretungsplan (${q.title.replace(/^.*an /, '')})\n${list.map((x) => `[ ] ${x.name}: Vertretung [Name], Admin-Zugang im Passwortmanager hinterlegt, Anbieter-Kontakt notiert`).join('\n')}\n` +
        `[ ] Kurzanleitung für die wichtigsten Aufgaben im Notfallhandbuch\n[ ] Vertretung einmal testweise durchspielen bis [Datum]` };
    case 'renewal':
      return { label: 'Schreiben: kündigen oder nachverhandeln', draft:
        `Betreff: ${a?.name} – Kündigung zum ${a?.renewalDate ? de(a.renewalDate) : '[Datum]'} / Bitte um Angebot\n\nSehr geehrte Damen und Herren,\n\n` +
        `hiermit kündigen wir unseren Vertrag über ${a?.name} (Kundennummer [Nummer]) fristgerecht zum ${a?.renewalDate ? de(a.renewalDate) : '[Datum]'}. ` +
        `Gerne prüfen wir eine Verlängerung, wenn Sie uns bis [Datum] ein angepasstes Angebot${a?.users !== undefined ? ` für ${a.users} Nutzer` : ''} senden.\n\nBitte bestätigen Sie den Eingang dieser Kündigung schriftlich.\n\n${sign}` };
  }
}

export function de(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
