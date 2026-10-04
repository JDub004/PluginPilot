import { setAnalyticsSink } from './analytics/events.js';
import { loadEnv } from './config/env.js';
import { createApp } from './http.js';

const env = loadEnv();
if (env.LOG_ANALYTICS === 'off') setAnalyticsSink(() => {});

createApp(env).listen(env.PORT, env.HOST, () => {
  process.stdout.write(`nebenkosten-check MCP listening on http://${env.HOST}:${env.PORT}/mcp\n`);
});
