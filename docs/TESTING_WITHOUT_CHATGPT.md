# Testing the plugins without a ChatGPT subscription (MCP Inspector)

The MCP Inspector is the official, free test tool for MCP servers. It runs on your own computer and talks to the live server on Render. Verified on 2026-10-05 with Inspector 2.9.0 against `https://trauerfall-lotse.onrender.com`.

## One-time setup (5 minutes)
1. Install **Node.js LTS** (free) from https://nodejs.org: download, click through the installer. Check: open a terminal (Windows: "PowerShell", Mac: "Terminal") and type `node -v`. A version number (≥ 20) must appear.
2. Wake the server (free tier sleeps): open https://trauerfall-lotse.onrender.com/health in your browser and wait for `{"ok":true}`. That can take up to a minute.

## Start the Inspector
In the terminal:
```
npx @modelcontextprotocol/inspector@2.9.0
```
Confirm the install question with `y`. The browser opens `http://127.0.0.1:6274` (if not, copy the full link with `MCP_INSPECTOR_API_TOKEN=…` from the terminal).

## Connect a plugin
In the Inspector:
- **Transport:** Streamable HTTP
- **URL:** one of
  - Surcharge Check: `https://trauerfall-lotse.onrender.com/surcharge/mcp`
  - Trauerfall-Lotse: `https://trauerfall-lotse.onrender.com/mcp`
  - Geburts-Lotse: `https://trauerfall-lotse.onrender.com/geburt/mcp`
- **Authentication:** none → **Connect**

Then open the **Tools** tab → **List Tools** → choose the tool → fill in the fields (or paste JSON) → **Run Tool**. The result appears as JSON; tools with a widget are also shown in the MCP Apps sandbox.

## Ready-made test cases (copy the JSON)

**Surcharge Check: should find USD 6,900 to dispute**
```json
{"carrier":"Maersk","originCountry":"DE","destinationCountry":"OM","bookingDate":"2026-03-03","sailingDate":"2026-03-05",
 "lines":[{"label":"Emergency Contingency Surcharge","amountUsd":6000,"containerType":"40HC","quantity":2},
          {"label":"Emergency Bunker Surcharge","amountUsd":900,"containerType":"40HC","quantity":2},
          {"label":"War Risk Surcharge","amountUsd":3000,"containerType":"40HC","quantity":2},
          {"label":"BAF","amountUsd":1240,"containerType":"40HC","quantity":2}]}
```
**Surcharge Check: lane outside the scope (Asia → Hamburg)**
```json
{"carrier":"Hapag-Lloyd","originCountry":"CN","destinationCountry":"DE","bookingDate":"2026-04-01","lines":[{"label":"War Risk Surcharge","amountUsd":3000,"containerType":"40HC"}]}
```
**Trauerfall-Lotse**
```json
{"dateOfDeath":"2026-09-28","survivingSpouse":true,"deceasedReceivedPension":true,"rentedApartment":true,"livedTogether":true}
```
**Geburts-Lotse**
```json
{"birthDate":"2026-09-15","motherEmployed":true,"parentsMarried":false,"needsChildcare":true}
```

## Without a browser (quick check in the terminal)
```
npx @modelcontextprotocol/inspector@2.9.0 --cli https://trauerfall-lotse.onrender.com/surcharge/mcp --method tools/list
```

## What this does not test
Whether ChatGPT picks the right tool from a natural question. That needs ChatGPT developer mode (paid plan). The Inspector tests the plugins themselves: inputs, logic, outputs, widgets.
