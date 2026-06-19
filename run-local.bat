@echo off
setlocal

echo ==============================================
echo   PokeRogue local test runner
echo ==============================================
echo.

REM 1. Kill any leftover dev server holding port 8000.
REM    A previous run that didn't exit cleanly will keep the port and silently
REM    block a new server from starting.
echo [1/5] Freeing port 8000 if a previous dev server is still running...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('  Killed PID ' + $_.OwningProcess) }"

REM 2. Pull latest changes from origin -- but only if the working tree is clean.
REM    If you have local edits, the pull is skipped so it can't clobber them.
echo [2/5] Pulling latest from origin...
git diff --quiet --ignore-submodules
if errorlevel 1 (
  echo   Skipping pull: uncommitted changes in the working tree.
) else (
  git diff --cached --quiet --ignore-submodules
  if errorlevel 1 (
    echo   Skipping pull: staged changes detected.
  ) else (
    git pull --ff-only --recurse-submodules=on-demand
    if errorlevel 1 (
      echo   WARNING: git pull failed or would require a merge. Continuing with current code.
    )
  )
)

REM 3. Make sure submodules (assets, locales) are initialized.
REM    Without locales/, every i18next.t() call returns the raw key.
echo [3/5] Verifying submodules are initialized...
git submodule update --init --recursive --depth 1
if errorlevel 1 (
  echo ERROR: git submodule update failed.
  exit /b 1
)

REM 4. Install dependencies if node_modules is missing.
if not exist "node_modules" (
  echo [4/5] Installing dependencies (one-time)...
  call pnpm install --frozen-lockfile
  if errorlevel 1 (
    echo ERROR: pnpm install failed.
    exit /b 1
  )
) else (
  echo [4/5] Dependencies already installed, skipping.
)

REM 5. Start the dev server with --open so the browser launches automatically.
echo [5/5] Starting dev server at http://localhost:8000
echo.
echo The game will open in your default browser.
echo Turn on NVDA before the page finishes loading so the live regions are picked up.
echo Press Ctrl+C to stop the server.
echo.
call pnpm start:dev --open

endlocal
