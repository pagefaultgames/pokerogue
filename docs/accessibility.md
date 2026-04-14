# Accessibility Architecture

## Overview

PokeRogue renders all UI on an HTML5 canvas via Phaser 3 WebGL. Canvas content is invisible to screen readers by default. To make the game accessible, we use a **hidden DOM layer** that mirrors game state through ARIA live regions, plus **HTML form overlays** for login/register screens.

The core service is `AccessibilityManager` (`src/ui/accessibility-manager.ts`), a singleton that creates and manages hidden DOM elements inside the `#app` container.

## Hidden DOM Structure

When `AccessibilityManager.init()` is called (once, after Phaser boots), it creates:

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
- **Navigation instructions**: Each screen announces how to navigate when it opens (arrow keys, Z/Enter to select, X to cancel).
- **"Press enter to continue"**: Announced after messages with prompts so users know to advance.

## HTML Form Overlays (Login/Register)

The canvas-based login/register modals are fundamentally inaccessible because Phaser buttons can't receive keyboard focus when HTML inputs are focused. Instead, we use real HTML forms in `src/ui/a11y-form-overlay.ts`:

- **Login/Register choice**: Real HTML buttons with Tab navigation + "Play as Guest" option
- **Login form**: Username/Password fields with proper `<label>` elements, Enter to submit
- **Registration form**: Username/Password/Confirm Password with client-side validation
- **Error messages**: Announced via `aria-live="assertive"` alert region

The overlays are created in `src/phases/login-phase.ts` alongside the canvas modals, sitting on top visually.

## How to Add Accessibility to a New UI Handler

### Step 1: Import AccessibilityManager

```typescript
import { AccessibilityManager } from "#ui/accessibility-manager";
```

### Step 2: Announce context on show

When the handler becomes active, announce navigation instructions:

```typescript
show(args: any[]): boolean {
  // ... existing logic ...

  AccessibilityManager.getInstance().announceContext(
    "Party. Up/Down to select Pokémon, Z or Enter to choose, X to cancel."
  );

  return true;
}
```

### Step 3: Announce cursor changes

When the cursor moves, announce what is now selected:

```typescript
setCursor(cursor: number): boolean {
  const result = super.setCursor(cursor);

  // Announce the newly selected item with relevant details
  const pokemon = party[cursor];
  AccessibilityManager.getInstance().announceMessage(
    `${pokemon.name}, Level ${pokemon.level}, HP ${pokemon.hp}/${pokemon.maxHp}`
  );

  return result;
}
```

### Step 4: Clear on hide

When the handler is hidden or cleared:

```typescript
clear(): void {
  super.clear();
  AccessibilityManager.getInstance().clearMenu();
}
```

## Currently Hooked Handlers

### Battle Screens
- **battle-message-ui-handler.ts** -- Battle messages with speaker name (e.g., "Oak: Welcome!")
- **message-ui-handler.ts** -- All dialogue/message text + "Press enter to continue" after prompts
- **command-ui-handler.ts** -- Fight/Ball/Pokemon/Run with navigation instructions
- **fight-ui-handler.ts** -- Move name, type, category, power, accuracy, PP, effectiveness against opponent (e.g., "Thunderbolt, Electric type, Special, 90 power, 100% accuracy, PP 15 of 15, Super effective")
- **target-select-ui-handler.ts** -- Target Pokemon name with "Enemy" prefix
- **ball-ui-handler.ts** -- Pokeball name and count remaining (e.g., "Great Ball, 3 remaining")

### Menu Screens
- **title-ui-handler.ts** -- Welcome message, menu options, navigation instructions
- **menu-ui-handler.ts** -- Pause menu option labels
- **abstract-option-select-ui-handler.ts** -- Base class for all option menus; builds accessible menus and announces cursor
- **abstract-settings-ui-handler.ts** -- Setting name, current value, value changes, tab switching instructions
- **game-stats-ui-handler.ts** -- All visible stat labels and values when scrolling

### Pokemon Screens
- **starter-select-ui-handler.ts** -- Pokemon name, types, abilities (including hidden), full base stats (HP/Atk/Def/SpA/SpD/Spe), cost, caught status
- **party-ui-handler.ts** -- Pokemon name, level, HP, status + party option labels (Send Out, Summary, Cancel, etc.)
- **summary-ui-handler.ts** -- Pokemon summary info, page tabs (Profile/Stats/Moves), move details
- **pokedex-ui-handler.ts** -- Pokemon name, category (e.g., "Seed Pokémon"), types, caught status

### Other Screens
- **modifier-select-ui-handler.ts** -- Item name and description between rounds
- **save-slot-select-ui-handler.ts** -- Slot number, game mode, wave number
- **achvs-ui-handler.ts** -- Achievement name, unlock status, description
- **egg-list-ui-handler.ts** -- Egg descriptor and hatch waves remaining
- **egg-gacha-ui-handler.ts** -- Gacha pull options and costs
- **mystery-encounter-ui-handler.ts** -- Mystery encounter option labels
- **run-history-ui-handler.ts** -- Run mode, wave, victory/defeat status

### System Level
- **ui.ts** -- Mode transition labels via `announceContext()` (skips MESSAGE mode)
- **a11y-form-overlay.ts** -- Accessible HTML login/register/guest forms (bypasses canvas modals)
- **login-phase.ts** -- Integrates HTML overlay with game login flow + "Play as Guest" option

## Testing with NVDA

### Setup
1. Install NVDA from https://www.nvaccess.org/download/
2. Run `pnpm start:dev` to start the local development server (or use GitHub Pages).
3. Open the game in a browser (Chrome recommended).
4. Start NVDA if it is not already running.

### Navigation Controls
- **Arrow keys**: Navigate menus and options
- **Z or Enter**: Select / confirm
- **X or Backspace**: Cancel / go back
- **F / R**: Switch settings tabs (previous/next)
- **V**: Open filter menu (starter select)
- **E / N**: Change ability / nature (starter select)

### What to Verify
- Login screen offers Login, Register, and Play as Guest options
- Title screen announces context and menu options on load
- Each screen announces navigation instructions when it opens
- Command menu (Fight/Ball/Pokemon/Run) announces each option
- Fight menu announces move details including effectiveness
- Battle messages are read aloud with "Press enter to continue"
- Starter select reads Pokemon name, types, abilities, base stats
- Party screen reads Pokemon name, level, HP, and status
- Settings announce setting name and value, change with Left/Right
- Pokedex reads Pokemon name, category, types, caught status

### Debugging Tips
- Open browser DevTools and inspect `#a11y-root` to see what text is in the live regions.
- Use NVDA's speech viewer (Tools > Speech Viewer) to see a log of all announcements.
- If announcements are missing, verify that `AccessibilityManager.init()` has been called and that `#a11y-root` exists in the DOM.
- Check `#a11y-form-overlay` exists when login/register screens are active.

## GitHub Pages Deployment

The game auto-deploys to GitHub Pages on every push to `feature/screen-reader-accessibility`:
- **URL**: https://michaeljohann1.github.io/pokerogue/
- **Workflow**: `.github/workflows/deploy-pages.yml`
- **Limitation**: The PokeRogue API blocks CORS from `github.io`, so login/register won't work. Use "Play as Guest" instead.
- **Saves**: Guest mode saves to browser localStorage (local to that browser only).
