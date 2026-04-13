# Accessibility Architecture

## Overview

PokeRogue renders all UI on an HTML5 canvas via Phaser 3 WebGL. Canvas content is invisible to screen readers by default. To make the game accessible, we use a **hidden DOM layer** that mirrors game state through ARIA live regions.

The core service is `AccessibilityManager` (`src/ui/accessibility-manager.ts`), a singleton that creates and manages hidden DOM elements inside the `#app` container.

## Hidden DOM Structure

When `AccessibilityManager.init()` is called (once, after Phaser boots), it creates:

```
#app
  canvas (game)
  #a11y-root (.sr-only)
    #a11y-message  [role="log",    aria-live="assertive", aria-atomic="true"]
    #a11y-context  [role="status", aria-live="polite",    aria-atomic="true"]
    #a11y-menu     [role="menu",   aria-label="Menu"]
```

The `#a11y-root` element has the CSS class `sr-only`, which visually hides it while keeping it in the accessibility tree.

## ARIA Live Region Strategy

| Region | aria-live | Purpose | When to use |
|---|---|---|---|
| `#a11y-message` | `assertive` | Battle messages, dialogue, cursor changes | Content the user must hear immediately; interrupts current speech |
| `#a11y-context` | `polite` | Mode transitions, status info | Ambient changes; waits for current speech to finish |
| `#a11y-menu` | (none -- uses `role="menu"`) | Structured menu of options | When a list of selectable options is shown |

### Key Design Decisions

- **Assertive for messages**: Battle text and cursor selections use `assertive` so the user hears them right away, even if previous speech is still playing.
- **Polite for context**: Mode transitions (e.g., opening the command menu) use `polite` to avoid interrupting important content.
- **Do NOT announce `UiMode.MESSAGE` transitions**: These fire too frequently and produce excessive noise. The message text itself is already announced by the message handler.
- **Zero-width space trick**: `announceMessage()` appends alternating zero-width spaces so NVDA re-reads identical consecutive messages (e.g., repeated "Hit!" text).

## How to Add Accessibility to a New UI Handler

### Step 1: Import AccessibilityManager

```typescript
import { AccessibilityManager } from "#ui/accessibility-manager";
```

### Step 2: Announce on show/setup

When the handler becomes active (typically in `show()` or `setup()`), announce context and build a menu if applicable:

```typescript
show(args: any[]): boolean {
  // ... existing logic ...

  const a11y = AccessibilityManager.getInstance();

  // Announce what screen/mode the user is now in
  a11y.announceContext("Party selection. Use arrow keys to navigate.");

  // If there are selectable options, build an accessible menu
  const labels = this.options.map(opt => opt.label);
  a11y.setMenu(labels, 0, "Party Menu");
  a11y.announceMessage(labels[0]);

  return true;
}
```

### Step 3: Announce cursor changes

When the cursor moves (typically in `setCursor()` or `processInput()`):

```typescript
setCursor(cursor: number): boolean {
  const result = super.setCursor(cursor);

  // Announce the newly selected item
  AccessibilityManager.getInstance().announceMessage(this.options[cursor].label);

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

### battle-message-ui-handler.ts
Announces battle messages with the speaker's name prefixed (e.g., "Pikachu: Used Thunderbolt!").

### message-ui-handler.ts
Announces dialogue and general message text as it appears.

### command-ui-handler.ts
Announces the currently highlighted command label (Fight, Ball, Pokemon, Run) on cursor change.

### fight-ui-handler.ts
Announces the move name, type, and PP when the cursor moves between moves.

### target-select-ui-handler.ts
Announces the target Pokemon's name when the cursor changes during target selection.

### abstract-option-select-ui-handler.ts
Base class for option-select screens. Builds an accessible menu from option labels and announces cursor changes. Clears the menu on hide.

### title-ui-handler.ts
Announces the title screen context ("PokeRogue Title Screen. Use arrow keys to navigate, Enter or Z to select.") and builds a menu from the title options.

### modal-ui-handler.ts
Announces the modal title and available button options when a modal dialog is shown.

### abstract-settings-ui-handler.ts (in src/ui/settings/)
Announces the setting label and its current value when navigating through settings.

### ui.ts (mode orchestration)
Announces mode transition labels via `announceContext()` when switching between UI modes. Skips `UiMode.MESSAGE` to avoid noise.

## Testing with NVDA

### Setup
1. Install NVDA from https://www.nvaccess.org/download/
2. Run `pnpm start:dev` to start the local development server.
3. Open the game in a browser (Chrome recommended).
4. Start NVDA if it is not already running.

### Navigation Controls
- **Arrow keys**: Navigate menus and options
- **Z or Enter**: Select / confirm
- **X or Backspace**: Cancel / go back

### What to Verify
- Title screen announces its context and menu options on load.
- Command menu (Fight/Ball/Pokemon/Run) announces each option as you arrow through.
- Fight menu announces move name, type, and PP.
- Battle messages are read aloud as they appear.
- Target selection announces the target Pokemon's name.
- Mode transitions are announced (except MESSAGE mode).
- Settings announce the setting name and current value.

### Debugging Tips
- Open browser DevTools and inspect `#a11y-root` to see what text is being set in the live regions.
- Use NVDA's speech viewer (Tools > Speech Viewer) to see a log of all announcements.
- If announcements are missing, verify that `AccessibilityManager.init()` has been called and that `#a11y-root` exists in the DOM.
