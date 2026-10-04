# Deployment

## Local
```bash
npm ci && npm test && npm run build
PORT=8787 npm start            # http://localhost:8787/mcp
```
To try it in ChatGPT developer mode, expose it over HTTPS (e.g. `ngrok http 8787`) and add `https://<host>/mcp` as a connector.

## Production (any container/Node host: Render, Fly.io, Railway, Cloud Run)
- Build `npm ci && npm run build`, start `node dist/src/index.js`.
- Env: see `.env.example`. HTTPS terminates at the platform. Health check: `GET /health`.
- Add a platform rate limit (e.g. 60 req/min/IP) and request logging **without bodies**.
- Single instance is enough; the server is stateless and scales horizontally.

Not deployed yet: it needs a hosting account and domain from the owner.
