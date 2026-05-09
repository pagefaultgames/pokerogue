# CLAUDE.md - Project Guide for Claude Code

## Project Overview

PokeRogue is a browser-based Pokemon roguelite fangame built with **Phaser 3**, **TypeScript**, and **Vite**. This is a fork (MichaelJohann1/pokerogue) focused on adding **screen reader accessibility** for NVDA and other assistive technology.

## Architecture

All UI is canvas-based via Phaser 3 WebGL -- there are no native DOM elements for the game UI. Accessibility is achieved through a **hidden DOM layer** (`a11yManager`) that creates ARIA live regions mirroring game state, allowing screen readers to announce battle text, menu options, and cursor changes.

### Key Files

- `src/ui/accessibility-manager.ts` -- Module singleton (`a11yManager`) that creates a hidden DOM layer with ARIA live regions inside `#app`. Also exports `getKeyLabelForButton(button)` which resolves the user's actual bound key for a given `Button` enum value. The helper checks `inputController.getLastSourceDevice()` so a player using a gamepad hears the gamepad button name (e.g. "A") and a player using a keyboard hears the keyboard label (e.g. "SPACE"), even though both devices have bindings for the same Button.
- `src/ui/a11y-form-overlay.ts` -- Accessible HTML form overlays for login/register screens. Replaces inaccessible canvas modals.
- `src/ui/handlers/` -- UI handler classes for each game screen/mode. These have accessibility hooks added.
- `src/ui/ui.ts` -- Mode orchestration. Manages transitions between UI modes and announces mode changes via `announceContext()`.
- `src/ui/settings/abstract-settings-ui-handler.ts` -- General/Display/Audio settings. Tab-switch instructions use the user's actual bound keys for `Button.CYCLE_FORM` / `Button.CYCLE_SHINY` (default F/R) and `Button.CANCEL`.
- `src/ui/settings/abstract-control-settings-ui-handler.ts` -- Keyboard / Gamepad bindings tabs. Has its own a11y hooks (separate parent class from the general settings) that read out each binding row + bound key as the cursor moves.
- `src/ui-inputs.ts` -- Global keyboard/gamepad input routing. `buttonStats` hooks the stats key (default `C`) to announce HP/status for all active Pokémon in battle.
- `locales/en/accessibility.json` -- Locale namespace holding all screen-reader strings. **Lives in the locales submodule, not the main repo.** Each context-with-keybindings string has a `*NoKey` fallback used when key resolution fails (e.g. before input is initialized). All directional placeholders (`{{up}}` / `{{down}}` / `{{left}}` / `{{right}}`) and named-key placeholders (`{{action}}` / `{{cancel}}` / etc.) are filled at announce time from `getKeyLabelForButton`.

### Submodule Setup

`.gitmodules` currently points the `locales` submodule at `MichaelJohann1/pokerogue-locales` on branch `feature/accessibility-namespace` -- this is the fork that holds the new `accessibility.json` namespace while the locales PR is in review. **Before final upstream merge**, the URL must flip back to `pagefaultgames/pokerogue-locales` and the submodule SHA bumped to whatever commit on `pagefaultgames/pokerogue-locales:main` ends up containing the merged accessibility namespace. Doing it any earlier breaks fresh clones because the file only exists on the fork.

### Path Aliases

- `#ui/*` maps to `src/ui/**/*.ts`
- `#api/api` (renamed in upstream/beta from `#api/pokerogue-api`) -- API client; if you grep older docs for `pokerogue-api`, update to `api/api`
- `#utils/color-utils` (new in upstream/beta) -- holds `argbFromRgba` / `rgbHexToRgba` (these used to come from `@material/material-color-utilities` and `#utils/common`)

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

// Assertive announcement (interrupts current speech) -- use for cursor changes, mass content
a11yManager.announceMessage(i18next.t("accessibility:filterToggled", { label: optionText }));

// Polite announcement (waits for current speech) -- use for mode transitions, screen-context info
const action = getKeyLabelForButton(Button.ACTION);
const cancel = getKeyLabelForButton(Button.CANCEL);
a11yManager.announceContext(
  action && cancel
    ? i18next.t("accessibility:menuContext", { action, cancel })
    : i18next.t("accessibility:menuContextNoKey"),
);

// Build an accessible menu from option labels (canvas-only menus need the parallel ARIA structure)
a11yManager.setMenu(labels, 0, i18next.t("accessibility:menu"));
a11yManager.updateMenuCursor(newIndex);
a11yManager.clearMenu();
```

### Important Rules

- **Do NOT announce `UiMode.MESSAGE` transitions** -- they fire too frequently and produce noisy output.
- **Do NOT hardcode key names** like "Z" or "Enter" in announcements -- use `getKeyLabelForButton(Button.X)` and the locale variants. Provide a `*NoKey` fallback string for the case where input isn't yet initialized (the helper returns `""`). Directional words (`Up` / `Down` / `Left` / `Right`) are also dynamic via `getKeyLabelForButton(Button.UP)` etc., not hardcoded.
- **Do NOT hardcode English text** -- add a key to `locales/en/accessibility.json` and call `i18next.t("accessibility:...")`.
- **Do NOT pair two assertive announcements in the same `show()` flow.** `setCursor(0)` (or any equivalent) inside `show()` already fires `announceMessage(...)`. A subsequent `announceMessage` on the same flow will INTERRUPT the cursor announcement on the assertive live region and clobber its position info before NVDA reads it. Use `announceContext` (polite) for the screen-context line, and let `setCursor` own the assertive live region. This bug pattern was found and fixed in `AbstractOptionSelectUiHandler`, `TitleUiHandler`, `SummaryUiHandler`, and `StarterSelectUiHandler` -- if you add new screens, watch for it.
- **Beta enforces `lint/style/noNegationElse` strictly.** Write `x === null ? "" : value` rather than `x !== null ? value : ""`. The reverse trips biome:ci.
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
| `abstract-option-select-ui-handler` | Option label + position ("Item N of M") on cursor move; setMenu builds parallel ARIA menu structure |
| `title-ui-handler` | Title screen context (uses bound directional keys); first menu option via inherited `setCursor(0)` |
| `abstract-settings-ui-handler` | Setting label, current value, and tab-switch instructions using the bound CYCLE_FORM/CYCLE_SHINY keys (general/display/audio tabs) |
| `abstract-control-settings-ui-handler` | Each binding row's setting label + currently bound key (or "unbound") for the keyboard / gamepad settings tabs |
| `starter-select-ui-handler` | Pokemon name, types, abilities, base stats, cost, grid position (row/col); filter bar labels, dropdown options, toggle state; Start Run button, Randomize button, party-slot cursors. Team roster announces on add / remove / re-entry |
| `party-ui-handler` | Pokemon name, level, HP, status + party option labels |
| `modifier-select-ui-handler` | Item name, description + navigation context |
| `menu-ui-handler` | Pause menu option labels + position ("Item N of M") |
| `save-slot-select-ui-handler` | Slot number, game mode, wave; "Empty" for unused slots |
| `summary-ui-handler` | Pokemon summary (polite), page tabs, move details |
| `achvs-ui-handler` | Achievement name, status, description |
| `egg-list-ui-handler` | Egg descriptor, hatch waves |
| `egg-gacha-ui-handler` | Gacha pull options |
| `ball-ui-handler` | Pokeball name and count remaining |
| `mystery-encounter-ui-handler` | Mystery encounter option labels |
| `run-history-ui-handler` | Run mode, wave, victory/defeat |
| `run-info-ui-handler` | Run-details summary on open + page-cycle announcements (Hall of Fame / Ending Art / Main) |
| `pokedex-ui-handler` | Pokemon name, category, types, caught status |
| `pokedex-page-ui-handler` | Per-species detail page: species + types + caught state on open, section name + position on cursor move |
| `game-stats-ui-handler` | All visible stat labels and values |
| `challenges-select-ui-handler` | Challenge title, navigation instructions, current challenge name + value on UP/DOWN, value on LEFT/RIGHT, start button state |
| `abstract-binding-ui-handler` | "Press a key to bind" prompt + dynamic cancel-key label, capture confirmation with bound action key |
| `rename-form-ui-handler` | Modal title, nickname field label + current value, Rename/Cancel buttons |
| `rename-run-ui-handler` | Modal title, run-name field label, Rename/Cancel buttons |
| `pokedex-scan-ui-handler` | Modal title, field label + current value, Select/Cancel buttons |
| `daily-run-scoreboard` (`@deprecated`) | Loading state + page summary + per-entry rank/username/score/wave. Currently dormant -- the class isn't instantiated anywhere in the current codebase, hooks are pre-wired for whoever rewires it |
| `ui.ts` | Mode transition labels via `announceContext()` |
| `a11y-form-overlay.ts` | Login/Register HTML forms (bypasses canvas modals) |
| `ui-inputs.ts` | Stats key announces HP / max HP / percent / status / level for every active Pokémon in battle, enemies first |
| `level-up-phase.ts` | "{Pokemon} reached level {N}" -- announced unconditionally so screen readers stay informed even when the visual notification setting suppresses the showText prompt |

## PR Status

This branch (`feature/screen-reader-accessibility` on `MichaelJohann1/pokerogue`) targets `pagefaultgames/pokerogue:beta`.

- **Up to date with upstream/beta**: yes (merged via `git merge upstream/beta`; merge commit resolves the two real conflicts and adapts to beta's renames). 0 commits behind, 53 commits ahead. PR diff is ~51 files / +2,217 / −12.
- **Locales PR**: needs to be opened separately at `MichaelJohann1/pokerogue-locales:feature/accessibility-namespace` -> `pagefaultgames/pokerogue-locales:main`. Once that merges, revert the `.gitmodules` URL change in this PR and bump the submodule SHA to the upstream merged commit.
- **TypeScript**: clean (`pnpm typecheck`).
- **Biome lint+format**: clean across all 41 changed files (`pnpm biome:ci`).
- **Tests**: passing UI suites we touched (`pokedex.test.ts`, `starter-select.test.ts`, `rebinding-setting.test.ts`, `inputs.test.ts` -- 44 passed, 9 todo, 0 failed).

A safety tag `pre-rebase-20260509` and a backup branch `backup-pre-rebase` exist locally in case you ever need to roll back to the pre-merge state.
