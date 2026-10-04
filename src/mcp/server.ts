import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCheckUtilityStatement } from '../tools/checkUtilityStatement.js';

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'nebenkosten-check', version: '0.1.0' },
    {
      instructions:
        'Checks German utility statements (Nebenkostenabrechnung) with deterministic rules. ' +
        'Extract all cost lines from the statement the user provides, then call check_utility_statement. ' +
        'Present errors first with the legal basis, then the objection deadline. Never present results as legal advice.',
    },
  );
  registerCheckUtilityStatement(server);
  return server;
}
