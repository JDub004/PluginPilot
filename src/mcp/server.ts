import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCheckSurcharges } from '../tools/checkSurcharges.js';
import { registerDraftLetter } from '../tools/draftLetter.js';
import { registerPlanAfterBirth } from '../tools/planAfterBirth.js';
import { registerPlanAfterDeath } from '../tools/planAfterDeath.js';

export type PluginKind = 'trauerfall' | 'geburt' | 'surcharge';
const today = () => new Date().toISOString().slice(0, 10);

/** One MCP server per plugin; all share the deadline core and the timeline widget. */
export function createServer(kind: PluginKind = 'trauerfall', now: () => string = today): McpServer {
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
