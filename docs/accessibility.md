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
- **Navigation instructions**: Each screen announces how to navigate when it opens. Key names in the announcement come from `getKeyLabelForButton(button)` so they reflect the user's actual bindings, not hardcoded defaults. This includes directional keys (`Up`/`Down`/`Left`/`Right` are dynamic) and named keys (`action`, `cancel`, `prevTab`, `nextTab`, `cycleForm`, etc.).
- **Position context**: Menus announce "Item N of M" alongside the option label; grids (e.g. starter select) announce "Row R of T, column C of K".
- **"Press {key} to continue"**: After dialogue prompts, the announcement uses the bound action key (default Space, alt Z) rather than the hardcoded "Enter" used previously.
- **Active-device priority**: `getKeyLabelForButton` consults `inputController.getLastSourceDevice()` and resolves on whichever device the player just pressed something on. A keyboard player hears keyboard names; a gamepad player hears gamepad button names ("A", "B", "DPAD UP", etc.) from the active pad config (Xbox 360, DualShock, Pro Controller, SNES, generic). The helper falls back to the other device if the active one has no binding for that button.
- **Never pair two assertive announcements in the same flow**: If a `show()` calls `setCursor(0)` (which announces on the assertive live region), do NOT immediately follow with another `announceMessage` -- the second call interrupts the first before NVDA reads it. Use `announceContext` (polite) for the screen-context line; the polite region queues behind the assertive one. This bug pattern was found and fixed in `AbstractOptionSelectUiHandler`, `TitleUiHandler`, `SummaryUiHandler`, and `StarterSelectUiHandler`.

## Localization

All screen-reader strings live in `locales/en/accessibility.json`. While this PR is in review, that file lives on `MichaelJohann1/pokerogue-locales:feature/accessibility-namespace` -- a fork of the upstream `pagefaultgames/pokerogue-locales` submodule. `.gitmodules` points the submodule at the fork until the locales PR merges into upstream main, at which point the URL flips back to upstream and the submodule SHA bumps to the merged commit.

Strings are loaded as the `accessibility` namespace via the standard i18next setup (`src/plugins/i18n.ts` + `src/plugins/vite/namespaces-i18n-plugin.ts` -- the namespace is auto-registered from the file name). Use `i18next.t("accessibility:keyName", { ...placeholders })` from any UI handler.

### Multi-language support

i18next falls back to English when a translation is missing for the user's selected language (configured at `src/plugins/i18n.ts:170-173` -- `fallbackLng: { default: ["en"] }`). The accessibility namespace currently only ships English keys; players on every other supported language (de, fr, ja, zh-Hans, zh-Hant, es-ES, es-419, ko, pt-BR, ru, etc. -- 24 total) hear English announcements as fallback.

The project's contribution flow handles non-English translations automatically -- the [Translation Team uses Pontoon](localization.md#submitting-locales-changes) to translate any new English keys into every supported language. So:

1. The English keys go into the locales PR (already done -- the fork's `feature/accessibility-namespace` branch).
2. The Translation Team backfills `locales/<lang>/accessibility.json` for every supported language on their schedule via Pontoon.
3. Until that happens, English fallback works -- nothing is broken, AT users on non-English UIs just hear English announcements.

For strings that interpolate a key name (e.g. "Press {action} to confirm"), provide both a primary key and a `*NoKey` fallback string. The primary key is used when `getKeyLabelForButton(...)` returns a real label; the fallback is used when the input layer hasn't been initialized yet (the helper returns `""` in that case). The same pattern applies to directional placeholders. Example:

```typescript
const up = getKeyLabelForButton(Button.UP);
const down = getKeyLabelForButton(Button.DOWN);
const action = getKeyLabelForButton(Button.ACTION);
const cancel = getKeyLabelForButton(Button.CANCEL);
a11yManager.announceContext(
  up && down && action && cancel
    ? i18next.t("accessibility:menuContext", { up, down, action, cancel })
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

### Step 2: Announce context on show (polite)

When the handler becomes active, announce navigation instructions using the bound keys. **Use `announceContext` (polite)**, not `announceMessage`, so the screen-context line doesn't fight whatever the cursor announces:

```typescript
show(args: any[]): boolean {
  // ... existing logic, including this.setCursor(0) which fires the assertive
  // cursor announcement ...

  const up = getKeyLabelForButton(Button.UP);
  const down = getKeyLabelForButton(Button.DOWN);
  const action = getKeyLabelForButton(Button.ACTION);
  const cancel = getKeyLabelForButton(Button.CANCEL);
  a11yManager.announceContext(
    up && down && action && cancel
      ? i18next.t("accessibility:partyContext", { up, down, action, cancel })
      : i18next.t("accessibility:partyContextNoKey"),
  );

  return true;
}
```

### Step 3: Announce cursor changes (assertive, with position)

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
- **level-up-phase.ts** -- "{Pokemon} reached level {N}" via `a11yManager.announceMessage()` regardless of the visual notification setting (previously silent in non-DEFAULT modes)

### Menu Screens
- **title-ui-handler.ts** -- Welcome message, menu options, navigation instructions
- **menu-ui-handler.ts** -- Pause menu option labels + "Item N of M" position
- **abstract-option-select-ui-handler.ts** -- Base class for all option menus; builds accessible menus and announces cursor + position
- **abstract-settings-ui-handler.ts** -- General/Display/Audio settings: setting name, current value, value changes; tab-switch instructions name the actual bound keys for `Button.CYCLE_FORM` / `Button.CYCLE_SHINY`
- **abstract-control-settings-ui-handler.ts** -- Keyboard/Gamepad bindings tabs: each row reads "{label}: bound to {key}" (or "unbound") via `getKeyWithSettingName`
- **abstract-binding-ui-handler.ts** -- Keyboard/gamepad rebinding flow. Prompt and confirmation strings use the bound cancel and action keys
- **challenges-select-ui-handler.ts** -- Challenge-mode setup screen
- **game-stats-ui-handler.ts** -- All visible stat labels and values when scrolling

### Pokemon Screens
- **starter-select-ui-handler.ts** -- Pokemon name, types, abilities (including hidden), base stats, cost, caught status, plus row/column position in the 9-column grid. Filter bar announces filter labels, dropdown options, toggle state. Start Run, Randomize, and party-slot cursors all announce when focused. Team roster announces on add / remove and on re-entry to the screen.
- **party-ui-handler.ts** -- Pokemon name, level, HP, status + party option labels (Send Out, Summary, Cancel, etc.)
- **summary-ui-handler.ts** -- Pokemon summary info (announceContext, polite), page tabs, move details
- **pokedex-ui-handler.ts** -- Pokemon name, category, types, caught status (the list view)
- **pokedex-page-ui-handler.ts** -- Per-species detail page: species + types + caught state on open, section name + position ("Item N of M") on cursor move

### Other Screens
- **modifier-select-ui-handler.ts** -- Item name and description between rounds
- **save-slot-select-ui-handler.ts** -- Slot number, game mode, wave number; "Empty" for unused slots
- **achvs-ui-handler.ts** -- Achievement name, unlock status, description
- **egg-list-ui-handler.ts** -- Egg descriptor and hatch waves remaining
- **egg-gacha-ui-handler.ts** -- Gacha pull options and costs
- **mystery-encounter-ui-handler.ts** -- Mystery encounter option labels
- **run-history-ui-handler.ts** -- Run mode, wave, victory/defeat status (the list view)
- **run-info-ui-handler.ts** -- Run-details summary on open + page-cycle announcements (Hall of Fame / Ending Art / Main)
- **daily-run-scoreboard.ts** (`@deprecated`) -- Loading state + page summary + per-entry rank/username/score/wave. Currently dormant -- the class isn't instantiated anywhere in the current codebase, hooks are pre-wired for whoever rewires it

### Canvas Form Handlers
- **rename-form-ui-handler.ts** -- "Rename Pokémon" modal
- **rename-run-ui-handler.ts** -- "Rename Run" modal
- **pokedex-scan-ui-handler.ts** -- Pokédex search/scan modal

### System Level
- **ui.ts** -- Mode transition labels via `announceContext()` (skips MESSAGE mode)
- **a11y-form-overlay.ts** -- Accessible HTML login/register forms (bypasses canvas modals)
- **ui-inputs.ts** -- Stats key (default `C`) announces HP / max HP / percent / status / level for every active Pokémon. Enemies are announced before player Pokémon so the most battle-critical info comes first.

## Testing with NVDA (Desktop)

### Setup
1. Install NVDA from https://www.nvaccess.org/download/
2. Run `run-local.bat` (Windows) or `./run-local.sh` (macOS / Linux). The script:
   1. Frees port 8000 by killing any leftover dev server from a previous run.
   2. Fast-forward-pulls `origin/feature/screen-reader-accessibility` if the working tree and index are both clean (silently skipped if you have local edits).
   3. Initializes the `assets` and `locales` submodules.
   4. Runs `pnpm install` if `node_modules` is missing.
   5. Starts the dev server with `--open`.
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
- Adding or removing a starter speaks "Added/Removed X to/from team. Team N of 6: ..."
- Settings announce setting name + value; switching tabs re-announces the new context
- Level-up phase announces the level-up event and stat changes even in non-default notification modes
- Menu cursor announcements include "Item N of M"

### Debugging Tips
- Open browser DevTools and inspect `#a11y-root` to see what text is in the live regions.
- Use NVDA's speech viewer (Tools > Speech Viewer) to see a log of all announcements.
- If announcements are missing, verify `a11yManager.init()` has been called and that `#a11y-root` exists in the DOM.
- Check `#a11y-form-overlay` exists when login/register screens are active.
- If a screen sounds like it's "cutting itself off" after entry, check for two `announceMessage` calls in the `show()` flow -- the second clobbers the first on the assertive live region.
- If NVDA reads out raw locale keys like `accessibility:menuContext`, the locales submodule isn't checked out at the fork branch with `accessibility.json`. Run `git submodule update --init --recursive` (or just `run-local.bat` / `run-local.sh`, which does it for you).

### Diagnostic Logging (TEMPORARY — revert before upstream PR)

While investigating an in-the-field issue with the keyboard / gamepad bindings tab not reading in NVDA, this branch carries a diagnostic surface:

- `AbstractControlSettingsUiHandler.announceCurrentSetting()` calls `appendA11yDebugLog(...)` on every invocation.
- That helper:
  - Appends a timestamped line to `localStorage["a11yDebugLog"]` (browser-side, fallback).
  - POSTs the same line to `/a11y-debug-log` on the dev server, where a tiny Vite middleware (`plugins/vite/a11y-debug-log-plugin.ts`) appends it to `.a11y-debug-log.txt` at the repo root.
- `.a11y-debug-log.txt` is in `.gitignore` and never committed.
- Two helpers are exposed on `window` for manual control from the DevTools console:
  - `dumpA11yLog()` -- downloads the localStorage copy as a `.txt` file.
  - `clearA11yLog()` -- wipes both the localStorage entry and the on-disk file.

**Workflow for diagnosing announcement bugs:**
1. Run `run-local.bat` (kills any old server, pulls latest, starts dev server).
2. Reproduce the issue (e.g. open Settings -> Keyboard tab, arrow up/down).
3. Read `.a11y-debug-log.txt` to see whether `announceCurrentSetting()` was called, what arguments it computed, and what string it sent to `a11yManager.announceMessage(...)`.

**Before opening the upstream PR**, the diagnostic infrastructure must be reverted:
- `src/ui/settings/abstract-control-settings-ui-handler.ts` -- remove `appendA11yDebugLog`, the `window.dumpA11yLog` / `clearA11yLog` declarations, and all call sites.
- `plugins/vite/a11y-debug-log-plugin.ts` -- delete the file.
- `vite.config.ts` -- remove the plugin import / registration.
- `.gitignore` -- remove the `.a11y-debug-log.txt` line.

Search for `appendA11yDebugLog` to find every reference.

### Beta integration notes

The branch is currently merged with `upstream/beta` (last sync: 2026-05-09). A few file paths and rules changed in beta that affect this work:

- `pokerogueApi` is imported from `#api/api` (renamed from `#api/pokerogue-api`).
- `argbFromRgba` and `rgbHexToRgba` come from `#utils/color-utils` (new file in beta; previously they were in `#utils/common` and `@material/material-color-utilities`).
- Biome's `lint/style/noNegationElse` rule is now strict. Use `x === null ? "" : value` instead of `x !== null ? value : ""`. The reverse pattern fails CI.
- Beta updated the `assets` submodule pointer; the merge brought that forward.
- Vitest 4.x reports i18next/font initialization errors during test bootstrap as "errors" but they don't fail the suite -- ignore them.

## Mobile Accessibility (Future Work)

Mobile screen-reader support (TalkBack on Android, VoiceOver on iOS) is **not in this PR** but is reachable from where this branch leaves things. The hidden DOM live regions described above already work on mobile -- both TalkBack and VoiceOver honor `aria-live`, `role="log"`, and `role="status"`. The gap is the input layer: on mobile the player drives the game via the on-screen touch d-pad and action pad rather than a keyboard, and those touch elements (in `index.html` under `#touchControls`) currently lack ARIA labels and don't respond to AT activation events.

### How to test if you start adding mobile support

1. **Pick a target screen reader**:
   - Android: TalkBack (built-in, Settings > Accessibility > TalkBack).
   - iOS: VoiceOver (Settings > Accessibility > VoiceOver, triple-click side button to toggle).

2. **Get the build onto the device**. Three options:
   - **Easiest**: run `run-local.bat` on your dev machine, find your machine's LAN IP (`ipconfig` / `ifconfig`), and visit `http://<LAN-IP>:8000` from the phone's browser on the same Wi-Fi. Vite binds to all interfaces by default (`pnpm start:dev` uses `vite --mode development` which listens on `0.0.0.0`).
   - **PWA install**: `pnpm build:app` produces a deployable bundle. Serve `dist/` over HTTPS (e.g. `npx serve dist` on a tunneled port via `cloudflared` / `ngrok`) and visit on phone -- the manifest lets the user install it as a PWA, which gives a more app-like AT experience.
   - **Real deploy**: push to a fork's GitHub Pages, Vercel, or Netlify and visit the deployed URL.

3. **Turn on the screen reader BEFORE opening the page**. AT generally hooks into the page on load; flipping it on mid-game often misses live regions that have already updated.

4. **Things to verify** (each is a likely gap to fix):
   - **Touch controls are reachable**. Swipe-right (TalkBack) or right-flick (VoiceOver) should land focus on each touch button in turn. If they don't read out -- because they have no `aria-label` -- add labels in `index.html` (e.g. `aria-label="Up"`, `aria-label="Action"`, etc.).
   - **Touch controls respond to AT activation**. Once focused, a double-tap should activate the button. Currently `TouchControl.bindKey` in `src/touch-controls.ts` only listens for `touchstart`/`pointerdown`/`touchend`/`pointerup`. AT typically fires a synthetic `click` (and Enter / Space `keydown`/`keyup` if the user is on a hardware keyboard). The earlier mobile-a11y commit on this branch added those listeners; that commit was reverted before merge but the diff is preserved in `git log` and can be cherry-picked back.
   - **Live regions still update**. Open mobile Safari / Chrome DevTools (USB-attached) and inspect `#a11y-root` -- the textContent should change as the game state changes, same as desktop. If TalkBack/VoiceOver isn't speaking those changes, check that the page is actually focused (some mobile browsers pause AT for backgrounded tabs).
   - **Focus isn't trapped on the game canvas**. The canvas itself is invisible to mobile AT (as it is on desktop). The user navigates by swiping between live regions and touch controls.
   - **Gestures don't conflict**. TalkBack/VoiceOver intercept swipes for their own navigation. The game shouldn't react to the user's exploratory swipes -- only to deliberate double-tap-to-activate. If you find swipes are triggering game actions through bubbled touchstart events, you may need a `role="application"` region toggle (which tells AT to stop intercepting gestures and pass them through verbatim) for the gameplay area, but only during active gameplay. Don't blanket-apply it to the whole `#app` because then the user can't navigate the touch controls.
   - **Orientation**. The visual layout reflows on portrait vs landscape; verify both look reasonable with the screen reader's focus indicator.

5. **Don't worry about parity with desktop NVDA on day one**. The goal is "the player can hear what's on screen and act on it" -- not "every announcement is identical." Mobile players accept slightly different phrasing if the underlying flow works.
