import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPlanAfterDeath } from '../tools/planAfterDeath.js';

export function createServer(now?: () => string): McpServer {
  const server = new McpServer(
    { name: 'trauerfall-lotse', version: '0.1.0' },
    {
      instructions:
        'Helps bereaved people in Germany with the official steps after a death. Be gentle and brief. ' +
        'Ask only for the date of death and the yes/no facts you are missing, then call plan_after_death. ' +
        'Present the next critical deadline first. Never give individual legal advice on the estate.',
    },
  );
  registerPlanAfterDeath(server, now);
  return server;
}
