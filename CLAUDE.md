# CLAUDE.md - Project Guide for Claude Code

## Project Overview

PokeRogue is a browser-based Pokemon roguelite fangame built with **Phaser 3**, **TypeScript**, and **Vite**. This is a fork (MichaelJohann1/pokerogue) focused on adding **screen reader accessibility** for NVDA and other assistive technology.

## Architecture

All UI is canvas-based via Phaser 3 WebGL -- there are no native DOM elements for the game UI. Accessibility is achieved through a **hidden DOM layer** (`AccessibilityManager`) that creates ARIA live regions mirroring game state, allowing screen readers to announce battle text, menu options, and cursor changes.

### Key Files

- `src/ui/accessibility-manager.ts` -- Core accessibility service (singleton). Creates hidden DOM with ARIA live regions inside `#app`.
- `src/ui/a11y-form-overlay.ts` -- Accessible HTML form overlays for login/register/guest screens. Replaces inaccessible canvas modals.
- `src/ui/handlers/` -- UI handler classes for each game screen/mode. These have accessibility hooks added.
- `src/ui/ui.ts` -- Mode orchestration. Manages transitions between UI modes and announces mode changes via `announceContext()`.
- `src/ui/settings/abstract-settings-ui-handler.ts` -- Settings handler with accessibility hooks for setting navigation.
- `src/phases/login-phase.ts` -- Login phase with HTML overlay integration and "Play as Guest" option. Calls `enableGuestMode()` when the guest button is clicked.
- `src/account.ts` -- Exports `isGuestMode` (runtime flag) and `enableGuestMode()`. Seeds `loggedInUser` as a `Guest` account so localStorage keys resolve.
- `src/system/game-data.ts` -- Save/load. Every server-sync branch checks `bypassLogin || isGuestMode` so guest saves go to localStorage only (no server calls that would fail on CORS and trigger a reset).
- `src/phases/game-over-phase.ts` -- Run-end flow. Guarded with `!isGuestMode` so guest runs skip the `savedata/session/newclear` POST (which CORS-fails on GitHub Pages and would otherwise show "server communication failed" and hard-reload the tab).
- `src/phases/title-phase.ts` -- Daily-run seed fetch. Guarded with `!isGuestMode` so guest daily runs fall back to the offline date-based seed instead of hitting the server.
- `src/ui-inputs.ts` -- Global keyboard/gamepad input routing. `buttonStats` hooks the stats key (default `C`) to announce HP/status for all active Pokémon in battle.

### Path Aliases

- `#ui/*` maps to `src/ui/**/*.ts`

## Build and Run

```bash
pnpm install          # Install dependencies
pnpm start:dev        # Local dev server
pnpm build            # Production build
```

Or use `run-local.bat` on Windows to start the dev server with auto-open.

## Deployment

GitHub Pages auto-deploys on every push to `feature/screen-reader-accessibility`:
- Live at: https://michaeljohann1.github.io/pokerogue/
- Workflow: `.github/workflows/deploy-pages.yml`
- Note: Login/register API is CORS-blocked on GitHub Pages. Use "Play as Guest" to test.
- Guest mode is fully offline: clicking "Play as Guest" sets `isGuestMode = true` and every save/load path writes to localStorage instead of the server. Without this, the first-wave `saveAll` would CORS-fail and `encounter-phase.ts` would call `globalScene.reset(true)`, bouncing the player back to the login screen.

## Testing with Screen Readers

1. Run `pnpm start:dev` to start the local dev server.
2. Enable NVDA (or another screen reader).
3. Navigate with **arrow keys**; press **Z** or **Enter** to select; **X** to cancel/go back.
4. During battle, press **C** to hear current HP / status / level for all active Pokémon (enemy first, then yours).
5. Verify announcements match on-screen content.
6. Each screen announces navigation instructions when it opens.

## Accessibility Pattern

When adding screen reader support to a UI handler:

```typescript
import { AccessibilityManager } from "#ui/accessibility-manager";

// Assertive announcement (interrupts current speech) -- use for battle messages, dialogue, cursor changes
AccessibilityManager.getInstance().announceMessage("Fight selected");

// Polite announcement (waits for current speech) -- use for mode transitions, status info
AccessibilityManager.getInstance().announceContext("Command menu opened");

// Build an accessible menu from option labels
AccessibilityManager.getInstance().setMenu(["Fight", "Ball", "Pokemon", "Run"], 0, "Battle Commands");

// Update cursor and announce selected item
AccessibilityManager.getInstance().updateMenuCursor(newIndex);

// Clear menu when leaving
AccessibilityManager.getInstance().clearMenu();
```

### Important Rules

- **Do NOT announce `UiMode.MESSAGE` transitions** -- they fire too frequently and produce noisy output.
- Use `announceMessage()` (assertive) for content the user must hear immediately.
- Use `announceContext()` (polite) for ambient status changes.
- Strip BBCode/formatting before announcing -- `AccessibilityManager` handles this internally via `stripFormatting()`.
- Each screen should announce **navigation instructions** when it opens (e.g., "Arrow keys to navigate, Z to select, X to go back").

## Currently Hooked Handlers

| Handler | What it announces |
|---|---|
| `battle-message-ui-handler` | Battle messages with speaker name |
| `message-ui-handler` | Dialogue/message text + "press enter to continue" |
| `command-ui-handler` | Command menu (Fight/Ball/Pokemon/Run) + navigation context |
| `fight-ui-handler` | Move name, type, category, power, accuracy, PP, effectiveness |
| `target-select-ui-handler` | Target Pokemon name (with Enemy prefix) |
| `abstract-option-select-ui-handler` | Option labels as menu items; cursor changes |
| `title-ui-handler` | Title screen context + menu options |
| `abstract-settings-ui-handler` | Setting label, current value, and tab switching instructions |
| `starter-select-ui-handler` | Pokemon name, types, abilities, full base stats, cost. Filter bar labels, dropdown options, toggle state. Start Run button, Randomize button, and party-slot cursors |
| `party-ui-handler` | Pokemon name, level, HP, status + party option labels |
| `modifier-select-ui-handler` | Item name, description + navigation context |
| `menu-ui-handler` | Pause menu option labels |
| `save-slot-select-ui-handler` | Slot number, game mode, wave |
| `summary-ui-handler` | Pokemon summary, page tabs, move details |
| `achvs-ui-handler` | Achievement name, status, description |
| `egg-list-ui-handler` | Egg descriptor, hatch waves |
| `egg-gacha-ui-handler` | Gacha pull options |
| `ball-ui-handler` | Pokeball name and count remaining |
| `mystery-encounter-ui-handler` | Mystery encounter option labels |
| `run-history-ui-handler` | Run mode, wave, victory/defeat |
| `pokedex-ui-handler` | Pokemon name, category, types, caught status |
| `game-stats-ui-handler` | All visible stat labels and values |
| `ui.ts` | Mode transition labels via `announceContext()` |
| `a11y-form-overlay.ts` | Login/Register/Guest HTML forms (bypasses canvas modals) |
| `ui-inputs.ts` | Stats key (default `C`) announces HP / max HP / percent / status / level for every active Pokémon in battle, enemies first |
