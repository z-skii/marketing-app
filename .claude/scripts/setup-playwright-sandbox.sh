#!/usr/bin/env bash
# Point playwright-cli at the Chromium that is preinstalled in Claude Code on the web
# sandboxes (and similar containers), instead of downloading a browser it can't fetch.
#
# Also disables Chromium's proxy: this container exports HTTP(S)_PROXY, which the
# browser would otherwise apply to http://127.0.0.1 too, and the proxy answers 403
# for some requests — which silently breaks hydration of a locally served app.
#
# No-ops on machines without a preinstalled Playwright browser — there, playwright-cli
# manages its own browsers and needs no config.
#
# Usage: bash .claude/scripts/setup-playwright-sandbox.sh
set -euo pipefail

BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"

chrome_bin="$(find "$BROWSERS_PATH" -maxdepth 3 -type f -name chrome -path '*chrome-linux*' 2>/dev/null | sort -V | tail -1)"

if [ -z "$chrome_bin" ]; then
  echo "No preinstalled Chromium under $BROWSERS_PATH — leaving playwright-cli to manage its own browser."
  exit 0
fi

mkdir -p .playwright
cat > .playwright/cli.config.json <<JSON
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "executablePath": "$chrome_bin",
      "chromiumSandbox": false,
      "args": ["--no-proxy-server"]
    }
  }
}
JSON

echo "Wrote .playwright/cli.config.json → $chrome_bin"
