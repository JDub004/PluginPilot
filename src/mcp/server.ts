import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerDraftLetter } from '../tools/draftLetter.js';
import { registerPlanAfterDeath } from '../tools/planAfterDeath.js';

export function createServer(now: () => string = () => new Date().toISOString().slice(0, 10)): McpServer {
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
