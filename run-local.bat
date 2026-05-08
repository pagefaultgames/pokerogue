@echo off
setlocal

echo ==============================================
echo   PokeRogue local test runner
echo ==============================================
echo.

REM 1. Make sure submodules (assets, locales) are initialized.
REM    Without locales/, every i18next.t() call returns the raw key.
echo [1/3] Verifying submodules are initialized...
git submodule update --init --recursive --depth 1
if errorlevel 1 (
  echo ERROR: git submodule update failed.
  exit /b 1
)

REM 2. Install dependencies if node_modules is missing.
if not exist "node_modules" (
  echo [2/3] Installing dependencies (one-time)...
  call pnpm install --frozen-lockfile
  if errorlevel 1 (
    echo ERROR: pnpm install failed.
    exit /b 1
  )
) else (
  echo [2/3] Dependencies already installed, skipping.
)

REM 3. Start the dev server with --open so the browser launches automatically.
echo [3/3] Starting dev server at http://localhost:8000
echo.
echo The game will open in your default browser.
echo Turn on NVDA before the page finishes loading so the live regions are picked up.
echo Press Ctrl+C to stop the server.
echo.
call pnpm start:dev --open

endlocal
