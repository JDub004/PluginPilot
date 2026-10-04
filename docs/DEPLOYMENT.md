# Deployment

## 1. Put it online (Render, free tier, Frankfurt)

**One click:** https://render.com/deploy?repo=https://github.com/jdub004/pluginpilot (sign in with GitHub, confirm the Blueprint, click *Apply*). If the repo is private, Render first asks for access to it via its GitHub app; grant access to `pluginpilot` only.

Manual alternative:
1. Sign in at https://render.com with the GitHub account that owns `jdub004/pluginpilot`.
2. **New → Blueprint**, choose this repository. Render reads `render.yaml` and builds the `Dockerfile`.
3. After the first deploy you get a URL like `https://trauerfall-lotse.onrender.com`. Check `https://…/health` → `{"ok":true}`.

Free-tier note: the service sleeps after inactivity, so the first request then takes ~30–60 s. Use a paid instance (~7 $/month) before real users.

## Plugin endpoints
- Trauerfall-Lotse: `https://<host>/mcp`
- Geburts-Lotse: `https://<host>/geburt/mcp`
- Surcharge Check: `https://<host>/surcharge/mcp`

Each is connected/submitted as its own app.

## 2. Connect it to ChatGPT (developer mode, for testing)
Requires a paid ChatGPT plan with developer mode. In ChatGPT: Settings → Apps/Connectors → Advanced → enable developer mode → create a new app/connector with the URL `https://<your-render-url>/mcp`, no authentication. (Menu names change; current steps: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt.)
Then test with the prompts in `tests/evaluation/prompts.trauerfall.json`.

## 3. Publish (later)
Plugin directory submission: privacy policy URL, support contact, screenshots (`assets/`), test prompts. Re-check https://developers.openai.com/plugins/deploy/submission first.

## Other places the same server works
The server is plain MCP, so with no code changes it also works in:
- Claude (custom connector)
- any MCP client
- the planned "OpenAI for Germany" for municipalities

Funeral homes can link to it, or later embed it as a white-label web page.

## Local
```bash
npm ci && npm test && npm run build && PORT=8787 npm start
npx tsx scripts/preview-widget.ts preview.html   # widget preview in the browser
```
