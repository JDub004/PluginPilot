#!/usr/bin/env sh
# Builds the upload ZIP for the OpenAI plugin portal from submission/software-stadt.
set -eu
cd "$(dirname "$0")/../submission/software-stadt"
rm -f ../software-stadt-1.0.0.zip
zip -qr ../software-stadt-1.0.0.zip plugin.json .codex-plugin/plugin.json .mcp.json assets/logo.png assets/logo.svg assets/composer-icon.png assets/screenshot-overview.png assets/screenshot-building.png
echo "built submission/software-stadt-1.0.0.zip"
