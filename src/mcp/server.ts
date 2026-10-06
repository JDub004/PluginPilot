import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCheckSurcharges } from '../tools/checkSurcharges.js';
import { registerDraftLetter } from '../tools/draftLetter.js';
import { registerMapSoftwareCity } from '../tools/mapSoftwareCity.js';
import { registerPlanAfterBirth } from '../tools/planAfterBirth.js';
import { registerPlanAfterDeath } from '../tools/planAfterDeath.js';

export type PluginKind = 'trauerfall' | 'geburt' | 'surcharge' | 'city';
const today = () => new Date().toISOString().slice(0, 10);

/** One MCP server per plugin; all share the deadline core and the timeline widget. */
export function createServer(kind: PluginKind = 'trauerfall', now: () => string = today, baseUrl = 'https://trauerfall-lotse.onrender.com'): McpServer {
  if (kind === 'city') {
    const server = new McpServer(
      { name: 'software-stadt', version: '0.1.0' },
      {
        instructions:
          'Turns a company\'s software landscape into an interactive town map. Ask the user, conversationally and department by department, ' +
          'which programs they use and the facts you are missing (users, licences, cost, owner, critical, importance 1-5, approved, data flows). ' +
          'Before building, offer to add key persons per department (role, business e-mail/phone, which programs they look after), the ' +
          'company sites with their city, and external partners (suppliers, customers, service providers) with the programs used to exchange data. ' +
          'Then call map_software_city. Lead with the avoidable cost in euros, urgent risks, upcoming notice deadlines and the top quests (each has a ready-to-copy draft). If an IT service provider prepares the map, pass its name as preparedBy. ' +
          'If the user pastes a spreadsheet or an accounting export, call import_software_list first and confirm the result. ' +
          'For a before/after comparison pass the previous app list as "before". Offer the share link and the report.',
      },
    );
    registerMapSoftwareCity(server, baseUrl, now);
    return server;
  }
  if (kind === 'surcharge') {
    const server = new McpServer(
      { name: 'surcharge-check', version: '0.1.0' },
      {
        instructions:
          'Audits ocean freight surcharges for shippers. Extract every charge line from the quote or invoice the user shares, ask only for missing ' +
          'carrier, countries, booking/sailing dates, then call check_freight_surcharges. Lead with the disputable amount and the flagged lines. ' +
          'Mention that disputes must be raised in writing within the contract claim window. Not legal advice.',
      },
    );
    registerCheckSurcharges(server, now);
    return server;
  }
  if (kind === 'geburt') {
    const server = new McpServer(
      { name: 'geburts-lotse', version: '0.1.0' },
      {
        instructions:
          'Helps new parents in Germany with official steps after a birth. Be warm and brief. Ask only for the birth date and missing yes/no facts, ' +
          'then call plan_after_birth. Present the next critical deadline first (Elterngeld and Kindergeld are only paid retroactively for a limited time).',
      },
    );
    registerPlanAfterBirth(server, now);
    return server;
  }
  const server = new McpServer(
    { name: 'trauerfall-lotse', version: '0.1.0' },
    {
      instructions:
        'Helps bereaved people in Germany with the official steps after a death. Be gentle and brief. ' +
        'Ask only for the date of death and the yes/no facts you are missing, then call plan_after_death. ' +
        'Present the next critical deadline first. Offer draft_letter for steps that have a letterType. Never give individual legal advice on the estate.',
    },
  );
  registerPlanAfterDeath(server, now);
  registerDraftLetter(server, now);
  return server;
}
