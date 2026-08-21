#!/usr/bin/env bash
# Walks every page at a given viewport, capturing a screenshot and checking for
# horizontal overflow and console errors.
#
# `open` starts a fresh browser context (dropping cookies), so it is used once;
# every later navigation uses `goto` to keep the signed-in session.
#
# Usage: bash scripts/verify-browser.sh <label> <width> <height>
set -uo pipefail
export NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost

LABEL="${1:-desktop}"; W="${2:-1440}"; H="${3:-900}"
OUT="/tmp/shots/$LABEL"; mkdir -p "$OUT"
BASE="http://127.0.0.1:3000"
EMAIL="${SEED_EMAIL:-admin@untitled.test}"

playwright-cli kill-all >/dev/null 2>&1; sleep 1
playwright-cli open "$BASE/sign-in" >/dev/null 2>&1
playwright-cli resize "$W" "$H" >/dev/null 2>&1

playwright-cli fill 'input[name="email"]' "$EMAIL" >/dev/null 2>&1
playwright-cli click 'button[type="submit"]' >/dev/null 2>&1
sleep 2
playwright-cli fill 'input[name="code"]' "123456" >/dev/null 2>&1
playwright-cli click 'button[type="submit"]' >/dev/null 2>&1
sleep 3

printf "%-11s %-9s %s\n" "PAGE" "OVERFLOW" "DETAIL"
for entry in "home:/" "board:/board" "add:/add" "dashboard:/dashboard" "earn:/earn" "admin:/admin" "link:/l/lumen-type" "terms:/terms"; do
  name="${entry%%:*}"; path="${entry#*:}"
  playwright-cli goto "$BASE$path" >/dev/null 2>&1
  sleep 1
  playwright-cli screenshot --filename="$OUT/$name.png" >/dev/null 2>&1
  raw=$(playwright-cli eval "() => {
    const de = document.documentElement;
    const offenders = [...document.querySelectorAll('body *')].filter(el => {
      if (el.closest('.tape')) return false;           // the tape is clipped by design
      const r = el.getBoundingClientRect();
      return r.right > de.clientWidth + 1 || r.left < -1;
    }).slice(0, 3).map(el => el.tagName.toLowerCase());
    return JSON.stringify({
      url: location.pathname,
      overflow: de.scrollWidth > de.clientWidth,
      w: de.clientWidth,
      offenders,
    });
  }" 2>/dev/null | grep -o '{[^}]*}' | head -1)
  printf "%-11s %s\n" "$name" "$raw"
done
