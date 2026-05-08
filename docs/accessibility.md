# Accessibility Architecture

## Overview

PokeRogue renders all UI on an HTML5 canvas via Phaser 3 WebGL. Canvas content is invisible to screen readers by default. To make the game accessible, we use a **hidden DOM layer** that mirrors game state through ARIA live regions, plus **HTML form overlays** for login/register screens.

The core service is `a11yManager` (`src/ui/accessibility-manager.ts`), a module-level singleton that creates and manages hidden DOM elements inside the `#app` container.

## Hidden DOM Structure

When `a11yManager.init()` is called (once, after Phaser boots), it creates:

```
#app [role="application", aria-label="PokéRogue game"]
  canvas [tabindex="0", aria-label="PokéRogue game window"]
  #a11y-root (.sr-only)
    #a11y-message  [role="log",    aria-live="assertive", aria-atomic="true"]
    #a11y-context  [role="status", aria-live="polite",    aria-atomic="true"]
    #a11y-menu     [role="menu",   aria-label="Menu"]
```

The `#a11y-root` element has the CSS class `sr-only`, which visually hides it while keeping it in the accessibility tree. The `role="application"` on `#app` is critical -- it tells screen readers to pass keyboard input through to the game instead of intercepting arrow keys.

## ARIA Live Region Strategy

| Region | aria-live | Purpose | When to use |
|---|---|---|---|
| `#a11y-message` | `assertive` | Battle messages, dialogue, cursor changes | Content the user must hear immediately; interrupts current speech |
| `#a11y-context` | `polite` | Mode transitions, status info | Ambient changes; waits for current speech to finish |
| `#a11y-menu` | (none -- uses `role="menu"`) | Structured menu of options | When a list of selectable options is shown |

### Key Design Decisions

- **Assertive for messages**: Battle text and cursor selections use `assertive` so the user hears them right away.
- **Polite for context**: Mode transitions use `polite` to avoid interrupting important content.
- **Do NOT announce `UiMode.MESSAGE` transitions**: These fire too frequently and produce excessive noise.
- **Zero-width space trick**: `announceMessage()` appends alternating zero-width spaces so NVDA re-reads identical consecutive messages.
- **Navigation instructions**: Each screen announces how to navigate when it opens. Key names in the announcement come from `getKeyLabelForButton(button)` so they reflect the user's actual bindings, not hardcoded defaults.
- **Position context**: Menus announce "Item N of M" alongside the option label; grids (e.g. starter select) announce "Row R of T, column C of K".
- **"Press {key} to continue"**: After dialogue prompts, the announcement uses the bound action key (default Space, alt Z) rather than the hardcoded "Enter" used previously.

## Localization

All screen-reader strings live in `locales/en/accessibility.json` and are loaded as the `accessibility` namespace via the standard i18next setup (`src/plugins/i18n.ts` + `src/plugins/vite/namespaces-i18n-plugin.ts` -- the namespace is auto-registered from the file name). Use `i18next.t("accessibility:keyName", { ...placeholders })` from any UI handler.

For strings that interpolate a key name (e.g. "Press {action} to confirm"), provide both a primary key and a `*NoKey` fallback string. The primary key is used when `getKeyLabelForButton(...)` returns a real label; the fallback is used when the input layer hasn't been initialized yet (the helper returns `""` in that case). Example:

```typescript
const action = getKeyLabelForButton(Button.ACTION);
const cancel = getKeyLabelForButton(Button.CANCEL);
a11yManager.announceContext(
  action && cancel
    ? i18next.t("accessibility:menuContext", { action, cancel })
    : i18next.t("accessibility:menuContextNoKey"),
);
```

## HTML Form Overlays (Login/Register)

The canvas-based login/register modals are fundamentally inaccessible because Phaser buttons can't receive keyboard focus when HTML inputs are focused. Instead, we use real HTML forms in `src/ui/a11y-form-overlay.ts`:

- **Login/Register choice**: Real HTML buttons with Tab navigation
- **Login form**: Username/Password fields with proper `<label>` elements, Enter to submit
- **Registration form**: Username/Password/Confirm Password with client-side validation
- **Error messages**: Announced via `aria-live="assertive"` alert region

The overlays are created in `src/phases/login-phase.ts` alongside the canvas modals, sitting on top visually.

## Offline Builds

To produce a build that doesn't talk to the PokéRogue server (e.g. for an internal demo where the API isn't reachable), run `pnpm build:app` -- this loads `.env.app` with `VITE_BYPASS_LOGIN=1`. The existing `bypassLogin` constant in `src/constants/app-constants.ts` is then `true` at runtime, and every `pokerogueApi.*` call site already branches on it to fall back to localStorage. No login screen is shown.

This is purely a build-time toggle; the game source has no runtime "guest mode" flag.

## How to Add Accessibility to a New UI Handler

### Step 1: Import the singleton + helpers

```typescript
import { Button } from "#enums/buttons";
import { a11yManager, getKeyLabelForButton } from "#ui/accessibility-manager";
import i18next from "i18next";
```

### Step 2: Announce context on show

When the handler becomes active, announce navigation instructions using the bound keys:

```typescript
show(args: any[]): boolean {
  // ... existing logic ...

  const action = getKeyLabelForButton(Button.ACTION);
  const cancel = getKeyLabelForButton(Button.CANCEL);
  a11yManager.announceContext(
    action && cancel
      ? i18next.t("accessibility:partyContext", { action, cancel })
      : i18next.t("accessibility:partyContextNoKey"),
  );

  return true;
}
```

### Step 3: Announce cursor changes (with position)

When the cursor moves, announce what is now selected and where in the list it sits:

```typescript
setCursor(cursor: number): boolean {
  const result = super.setCursor(cursor);

  const pokemon = party[cursor];
  const position = i18next.t("accessibility:menuPosition", {
    current: cursor + 1,
    total: party.length,
  });
  a11yManager.announceMessage(
    `${pokemon.name}, Level ${pokemon.level}, HP ${pokemon.hp} of ${pokemon.maxHp}. ${position}`,
  );

  return result;
}
```

For 2D grids (e.g. starter select), use `accessibility:gridPosition` instead with `row`/`rows`/`col`/`cols`.

### Step 4: Clear on hide

```typescript
clear(): void {
  super.clear();
  a11yManager.clearMenu();
}
```

## Currently Hooked Handlers

### Battle Screens
- **battle-message-ui-handler.ts** -- Battle messages with speaker name (e.g., "Oak: Welcome!"); level-up stat panel speaks every stat change (`promptLevelUpStats` was previously silent for the "stats only" notification mode)
- **message-ui-handler.ts** -- All dialogue/message text + "Press {action} to continue" after prompts, where `{action}` is the user's bound action key
- **command-ui-handler.ts** -- Fight/Ball/Pokemon/Run with dynamic navigation context
- **fight-ui-handler.ts** -- Move name, type, category, power, accuracy, PP, effectiveness against opponent
- **target-select-ui-handler.ts** -- Target Pokemon name with "Enemy" prefix
- **ball-ui-handler.ts** -- Pokeball name and count remaining

### Menu Screens
- **title-ui-handler.ts** -- Welcome message, menu options, navigation instructions
- **menu-ui-handler.ts** -- Pause menu option labels + "Item N of M" position
- **abstract-option-select-ui-handler.ts** -- Base class for all option menus; builds accessible menus and announces cursor + position
- **abstract-settings-ui-handler.ts** -- Setting name, current value, value changes; tab-switch instructions name the actual bound keys for `Button.CYCLE_FORM` / `Button.CYCLE_SHINY`
- **abstract-binding-ui-handler.ts** -- Keyboard/gamepad rebinding flow. Prompt and confirmation strings use the bound cancel and action keys
- **challenges-select-ui-handler.ts** -- Challenge-mode setup screen
- **game-stats-ui-handler.ts** -- All visible stat labels and values when scrolling

### Pokemon Screens
- **starter-select-ui-handler.ts** -- Pokemon name, types, abilities (including hidden), base stats, cost, caught status, plus row/column position in the 9-column grid. Filter bar announces filter labels, dropdown options, toggle state. Start Run, Randomize, and party-slot cursors all announce when focused.
- **party-ui-handler.ts** -- Pokemon name, level, HP, status + party option labels (Send Out, Summary, Cancel, etc.)
- **summary-ui-handler.ts** -- Pokemon summary info, page tabs, move details
- **pokedex-ui-handler.ts** -- Pokemon name, category, types, caught status

### Other Screens
- **modifier-select-ui-handler.ts** -- Item name and description between rounds
- **save-slot-select-ui-handler.ts** -- Slot number, game mode, wave number; "Empty" for unused slots
- **achvs-ui-handler.ts** -- Achievement name, unlock status, description
- **egg-list-ui-handler.ts** -- Egg descriptor and hatch waves remaining
- **egg-gacha-ui-handler.ts** -- Gacha pull options and costs
- **mystery-encounter-ui-handler.ts** -- Mystery encounter option labels
- **run-history-ui-handler.ts** -- Run mode, wave, victory/defeat status

### Canvas Form Handlers
- **rename-form-ui-handler.ts** -- "Rename Pokémon" modal
- **rename-run-ui-handler.ts** -- "Rename Run" modal
- **pokedex-scan-ui-handler.ts** -- Pokédex search/scan modal

### System Level
- **ui.ts** -- Mode transition labels via `announceContext()` (skips MESSAGE mode)
- **a11y-form-overlay.ts** -- Accessible HTML login/register forms (bypasses canvas modals)
- **ui-inputs.ts** -- Stats key (default `C`) announces HP / max HP / percent / status / level for every active Pokémon. Enemies are announced before player Pokémon so the most battle-critical info comes first.
- **level-up-phase.ts** -- "{Pokemon} reached level {N}" announced via `a11yManager.announceMessage()` regardless of the visual notification setting (previously silent in non-DEFAULT modes).

## Testing with NVDA

### Setup
1. Install NVDA from https://www.nvaccess.org/download/
2. Run `run-local.bat` (Windows) or `./run-local.sh` (macOS / Linux). The script initializes submodules, installs dependencies on first run, then starts the dev server with `--open`.
3. Start NVDA if it is not already running.

### Navigation Controls (defaults; remap in Settings)
- **Arrow keys**: Navigate menus and options
- **Space or Z**: Action / confirm (`Button.ACTION`)
- **Enter**: Submit (`Button.SUBMIT`)
- **Backspace or X**: Cancel / go back (`Button.CANCEL`)
- **C**: In battle, speak HP / status / level for every active Pokémon (enemies first). Same key toggles the visual stats flyout.
- **F / R**: Switch settings tabs (previous / next) -- announcements name whichever keys are actually bound

### What to Verify
- Title screen announces context and the first menu option on load
- Each screen announces navigation instructions on entry, naming the actual bound keys
- Command menu (Fight/Ball/Pokemon/Run) announces each option
- Fight menu announces move details including effectiveness
- Dialogue prompts read "Press {action} to continue" using the bound action key
- Pressing the bound stats key during battle announces enemy HP/status first, then player HP/status
- Starter select reads Pokemon name, types, abilities, base stats, and grid position (row/col)
- Settings announce setting name + value; switching tabs re-announces the new context
- Level-up phase announces the level-up event and stat changes even in non-default notification modes
- Menu cursor announcements include "Item N of M"

### Debugging Tips
- Open browser DevTools and inspect `#a11y-root` to see what text is in the live regions.
- Use NVDA's speech viewer (Tools > Speech Viewer) to see a log of all announcements.
- If announcements are missing, verify `a11yManager.init()` has been called and that `#a11y-root` exists in the DOM.
- Check `#a11y-form-overlay` exists when login/register screens are active.
