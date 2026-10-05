#!/usr/bin/env sh
# Builds the upload ZIP for the OpenAI plugin portal from submission/surcharge-check.
# The ZIP contains only the manifest, MCP config and assets (no secrets, no review notes).
set -eu
cd "$(dirname "$0")/../submission/surcharge-check"
rm -f ../surcharge-check-1.0.0.zip
zip -qr ../surcharge-check-1.0.0.zip plugin.json .codex-plugin/plugin.json .mcp.json assets/logo.png assets/logo.svg assets/composer-icon.svg assets/composer-icon.png assets/screenshot-audit-light.png assets/screenshot-audit-dark.png
echo "built submission/surcharge-check-1.0.0.zip"
