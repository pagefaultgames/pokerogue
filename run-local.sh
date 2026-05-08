#!/usr/bin/env bash
# PokeRogue local test runner. Mirrors run-local.bat for macOS / Linux / Git Bash.
set -euo pipefail

cd "$(dirname "$0")"

echo "=============================================="
echo "  PokeRogue local test runner"
echo "=============================================="

# 1. Make sure submodules (assets, locales) are initialized.
#    Without locales/, every i18next.t() call returns the raw key.
echo "[1/3] Verifying submodules are initialized..."
git submodule update --init --recursive --depth 1

# 2. Install dependencies if node_modules is missing.
if [ ! -d "node_modules" ]; then
  echo "[2/3] Installing dependencies (one-time)..."
  pnpm install --frozen-lockfile
else
  echo "[2/3] Dependencies already installed, skipping."
fi

# 3. Start the dev server with --open so the browser launches automatically.
echo "[3/3] Starting dev server at http://localhost:8000"
echo
echo "The game will open in your default browser."
echo "Turn on NVDA / VoiceOver before the page finishes loading so the live regions are picked up."
echo "Press Ctrl+C to stop the server."
echo

exec pnpm start:dev --open
