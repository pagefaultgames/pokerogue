# CLAUDE.md - Project Guide for Claude Code

## Project Overview

PokeRogue is a browser-based Pokemon roguelite fangame built with **Phaser 3**, **TypeScript**, and **Vite**. This is a fork (MichaelJohann1/pokerogue) focused on adding **screen reader accessibility** for NVDA and other assistive technology.

## Architecture

All UI is canvas-based via Phaser 3 WebGL -- there are no native DOM elements for the game UI. Accessibility is achieved through a **hidden DOM layer** (`a11yManager`) that creates ARIA live regions mirroring game state, allowing screen readers to announce battle text, menu options, and cursor changes.

### Key Files

- `src/ui/accessibility-manager.ts` -- Module singleton (`a11yManager`) that creates a hidden DOM layer with ARIA live regions inside `#app`. Also exports `getKeyLabelForButton(button)` for resolving the user's bound key for a given `Button` enum value (used so announcements stay accurate when keybindings are remapped).
- `src/ui/a11y-form-overlay.ts` -- Accessible HTML form overlays for login/register screens. Replaces inaccessible canvas modals.
- `src/ui/handlers/` -- UI handler classes for each game screen/mode. These have accessibility hooks added.
- `src/ui/ui.ts` -- Mode orchestration. Manages transitions between UI modes and announces mode changes via `announceContext()`.
- `src/ui/settings/abstract-settings-ui-handler.ts` -- Settings handler. Tab-switch instructions in the announcement use the user's actual bound keys for `Button.CYCLE_FORM` / `Button.CYCLE_SHINY` (default F/R) and `Button.CANCEL`.
- `src/ui-inputs.ts` -- Global keyboard/gamepad input routing. `buttonStats` hooks the stats key (default `C`) to announce HP/status for all active Pokémon in battle.
- `locales/en/accessibility.json` -- Locale namespace holding all screen-reader strings. Each context-with-keybindings string has a `*NoKey` fallback used when key resolution fails (e.g. before input is initialized).

### Path Aliases

- `#ui/*` maps to `src/ui/**/*.ts`

## Build and Run

```bash
pnpm install          # Install dependencies
pnpm start:dev        # Local dev server (uses .env.development -> bypassLogin = true)
pnpm build            # Production build (uses .env.production -> bypassLogin = false)
pnpm build:app        # Offline-first build (uses .env.app -> bypassLogin = true)
```

For one-shot local testing with submodule init + dependency install + dev server in a single command, run `run-local.bat` (Windows) or `./run-local.sh` (macOS / Linux / Git Bash).

## Testing with Screen Readers

1. Run `run-local.bat` (or `./run-local.sh`) to start the local dev server.
2. Enable NVDA (or another screen reader).
3. Navigate with **arrow keys**; the announcement reflects whatever key is bound to "action"/"cancel" (defaults: Space or Z to confirm, Backspace or X to cancel).
4. During battle, press the bound stats key (default `C`) to hear current HP / status / level for all active Pokémon (enemy first, then yours).
5. Each screen announces navigation instructions and grid/menu position (e.g. "Item 2 of 5", "Row 3 of 8, column 4 of 9") when entered.

## Accessibility Pattern

When adding screen reader support to a UI handler:

```typescript
import { Button } from "#enums/buttons";
import { a11yManager, getKeyLabelForButton } from "#ui/accessibility-manager";
import i18next from "i18next";

// Assertive announcement (interrupts current speech) -- use for battle messages, dialogue, cursor changes
a11yManager.announceMessage(i18next.t("accessibility:filterToggled", { label: optionText }));

// Polite announcement (waits for current speech) -- use for mode transitions, status info
const action = getKeyLabelForButton(Button.ACTION);
const cancel = getKeyLabelForButton(Button.CANCEL);
a11yManager.announceContext(
  action && cancel
    ? i18next.t("accessibility:menuContext", { action, cancel })
    : i18next.t("accessibility:menuContextNoKey"),
);

// Build an accessible menu from option labels
a11yManager.setMenu(labels, 0, i18next.t("accessibility:menu"));

// Update cursor and announce selected item
a11yManager.updateMenuCursor(newIndex);

// Clear menu when leaving
a11yManager.clearMenu();
```

### Important Rules

- **Do NOT announce `UiMode.MESSAGE` transitions** -- they fire too frequently and produce noisy output.
- **Do NOT hardcode key names** like "Z" or "Enter" in announcements -- use `getKeyLabelForButton(Button.X)` and the locale variants. Provide a `*NoKey` fallback string for the case where input isn't yet initialized (the helper returns `""`).
- **Do NOT hardcode English text** -- add a key to `locales/en/accessibility.json` and call `i18next.t("accessibility:...")`.
- Use `announceMessage()` (assertive) for content the user must hear immediately.
- Use `announceContext()` (polite) for ambient status changes.
- Strip BBCode/formatting before announcing -- `a11yManager` handles this internally via `stripFormatting()`.
- Each screen should announce **navigation instructions** when it opens, including which keys do what (resolved dynamically).

## Currently Hooked Handlers

| Handler | What it announces |
|---|---|
| `battle-message-ui-handler` | Battle messages with speaker name; level-up stat changes (always announced even when the visual stat panel is silent) |
| `message-ui-handler` | Dialogue/message text + "press {action} to continue" using the bound action key |
| `command-ui-handler` | Command menu (Fight/Ball/Pokemon/Run) + dynamic navigation context |
| `fight-ui-handler` | Move name, type, category, power, accuracy, PP, effectiveness |
| `target-select-ui-handler` | Target Pokemon name (with Enemy prefix) |
| `abstract-option-select-ui-handler` | Option label + position ("Item N of M") |
| `title-ui-handler` | Title screen context + first menu option |
| `abstract-settings-ui-handler` | Setting label, current value, and tab-switch instructions using the bound CYCLE_FORM/CYCLE_SHINY keys |
| `starter-select-ui-handler` | Pokemon name, types, abilities, base stats, cost, grid position (row/col); filter bar labels, dropdown options, toggle state; Start Run button, Randomize button, party-slot cursors |
| `party-ui-handler` | Pokemon name, level, HP, status + party option labels |
| `modifier-select-ui-handler` | Item name, description + navigation context |
| `menu-ui-handler` | Pause menu option labels + position ("Item N of M") |
| `save-slot-select-ui-handler` | Slot number, game mode, wave; "Empty" for unused slots |
| `summary-ui-handler` | Pokemon summary, page tabs, move details |
| `achvs-ui-handler` | Achievement name, status, description |
| `egg-list-ui-handler` | Egg descriptor, hatch waves |
| `egg-gacha-ui-handler` | Gacha pull options |
| `ball-ui-handler` | Pokeball name and count remaining |
| `mystery-encounter-ui-handler` | Mystery encounter option labels |
| `run-history-ui-handler` | Run mode, wave, victory/defeat |
| `pokedex-ui-handler` | Pokemon name, category, types, caught status |
| `game-stats-ui-handler` | All visible stat labels and values |
| `challenges-select-ui-handler` | Challenge title, navigation instructions, current challenge name + value on UP/DOWN, value on LEFT/RIGHT, start button state |
| `abstract-binding-ui-handler` | "Press a key to bind" prompt + dynamic cancel-key label, capture confirmation with bound action key |
| `rename-form-ui-handler` | Modal title, nickname field label + current value, Rename/Cancel buttons |
| `rename-run-ui-handler` | Modal title, run-name field label, Rename/Cancel buttons |
| `pokedex-scan-ui-handler` | Modal title, field label + current value, Select/Cancel buttons |
| `ui.ts` | Mode transition labels via `announceContext()` |
| `a11y-form-overlay.ts` | Login/Register HTML forms (bypasses canvas modals) |
| `ui-inputs.ts` | Stats key announces HP / max HP / percent / status / level for every active Pokémon in battle, enemies first |
| `level-up-phase.ts` | "{Pokemon} reached level {N}" — announced unconditionally so screen readers stay informed even when the visual notification setting suppresses the showText prompt |
