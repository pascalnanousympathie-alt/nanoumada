#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT"
if [[ ! -f node_modules/@remix-run/dev/dist/cli.js ]]; then
  echo "Nanoumada dependencies are missing. Install the project's dependencies before launching." >&2
  exit 2
fi
# Avoid spawning a second Vite process while the first one is still warming up.
if ps -ef 2>/dev/null | grep -E '[n]ode_modules/@remix-run/dev/dist/cli.js vite:dev --host 127.0.0.1 --port 5173 --strictPort' >/dev/null; then
  echo "Nanoumada's dev server process already exists; allow it to finish warming up: http://127.0.0.1:5173/"
  exit 0
fi
if command -v curl >/dev/null 2>&1; then
  STATUS="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/ 2>/dev/null || true)"
  if [[ "$STATUS" == "200" ]]; then
    echo "Nanoumada is already running: http://127.0.0.1:5173/"
    exit 0
  fi
fi
echo "Starting Nanoumada at http://127.0.0.1:5173/"
exec node node_modules/@remix-run/dev/dist/cli.js vite:dev --host 127.0.0.1 --port 5173 --strictPort
