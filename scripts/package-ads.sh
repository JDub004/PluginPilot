#!/usr/bin/env sh
# Builds the upload ZIP for the OpenAI plugin portal from submission/chatgpt-ads-check.
set -eu
cd "$(dirname "$0")/../submission/chatgpt-ads-check"
rm -f ../chatgpt-ads-check-1.0.0.zip
zip -qr ../chatgpt-ads-check-1.0.0.zip plugin.json .codex-plugin/plugin.json .mcp.json assets/logo.png assets/logo.svg assets/composer-icon.png assets/screenshot-report.png assets/screenshot-form.png
echo "built submission/chatgpt-ads-check-1.0.0.zip"
