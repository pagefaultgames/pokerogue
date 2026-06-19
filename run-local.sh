#!/usr/bin/env bash
# PokeRogue local test runner. Mirrors run-local.bat for macOS / Linux / Git Bash.
set -euo pipefail

cd "$(dirname "$0")"

echo "=============================================="
echo "  PokeRogue local test runner"
echo "=============================================="

# 1. Kill any leftover dev server holding port 8000.
#    A previous run that didn't exit cleanly will keep the port and silently
#    block a new server from starting.
echo "[1/5] Freeing port 8000 if a previous dev server is still running..."
if command -v lsof >/dev/null 2>&1; then
  # macOS / most Linux distros
  pids=$(lsof -ti tcp:8000 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing PIDs: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
elif command -v fuser >/dev/null 2>&1; then
  # Linux fallback (lsof not always installed in minimal containers)
  fuser -k 8000/tcp 2>/dev/null || true
else
  echo "  Skipping: neither lsof nor fuser is installed; can't auto-kill port 8000."
fi

# 2. Pull latest changes from origin -- but only if the working tree is clean.
#    If you have local edits, the pull is skipped so it can't clobber them.
echo "[2/5] Pulling latest from origin..."
if [ -z "$(git status --porcelain --ignore-submodules)" ]; then
  if git pull --ff-only --recurse-submodules=on-demand 2>&1; then
    :
  else
    echo "  WARNING: git pull failed or would require a merge. Continuing with current code."
  fi
else
  echo "  Skipping pull: uncommitted changes in the working tree."
fi

# 3. Make sure submodules (assets, locales) are initialized.
#    Without locales/, every i18next.t() call returns the raw key.
echo "[3/5] Verifying submodules are initialized..."
git submodule update --init --recursive --depth 1

# 4. Install dependencies if node_modules is missing.
if [ ! -d "node_modules" ]; then
  echo "[4/5] Installing dependencies (one-time)..."
  pnpm install --frozen-lockfile
else
  echo "[4/5] Dependencies already installed, skipping."
fi

# 5. Start the dev server with --open so the browser launches automatically.
echo "[5/5] Starting dev server at http://localhost:8000"
echo
echo "The game will open in your default browser."
echo "Turn on NVDA / VoiceOver before the page finishes loading so the live regions are picked up."
echo "Press Ctrl+C to stop the server."
echo

exec pnpm start:dev --open
