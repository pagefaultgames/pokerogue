# CLAUDE.md - Project Guide for Claude Code

## Project Overview

PokeRogue is a browser-based Pokemon roguelite fangame built with **Phaser 3**, **TypeScript**, and **Vite**. This is a fork (MichaelJohann1/pokerogue) focused on adding **screen reader accessibility** for NVDA and other assistive technology.

## Architecture

All UI is canvas-based via Phaser 3 WebGL -- there are no native DOM elements for the game UI. Accessibility is achieved through a **hidden DOM layer** (`AccessibilityManager`) that creates ARIA live regions mirroring game state, allowing screen readers to announce battle text, menu options, and cursor changes.

### Key Files

- `src/ui/accessibility-manager.ts` -- Core accessibility service (singleton). Creates hidden DOM with ARIA live regions inside `#app`.
- `src/ui/handlers/` -- UI handler classes for each game screen/mode. These need accessibility hooks added.
- `src/ui/ui.ts` -- Mode orchestration. Manages transitions between UI modes and announces mode changes via `announceContext()`.
- `src/ui/settings/abstract-settings-ui-handler.ts` -- Settings handler with accessibility hooks for setting navigation.

### Path Aliases

- `#ui/*` maps to `src/ui/**/*.ts`

## Build and Run

```bash
pnpm install          # Install dependencies
pnpm start:dev        # Local dev server
pnpm build            # Production build
```

## Testing with Screen Readers

1. Run `pnpm start:dev` to start the local dev server.
2. Enable NVDA (or another screen reader).
3. Navigate with **arrow keys**; press **Z** or **Enter** to select.
4. Verify announcements match on-screen content.

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

## Currently Hooked Handlers

| Handler | What it announces |
|---|---|
| `battle-message-ui-handler` | Battle messages with speaker name |
| `message-ui-handler` | Dialogue/message text |
| `command-ui-handler` | Command menu cursor changes (Fight/Ball/Pokemon/Run) |
| `fight-ui-handler` | Move name, type, and PP on cursor change |
| `target-select-ui-handler` | Target Pokemon name on cursor change |
| `abstract-option-select-ui-handler` | Option labels as menu items; cursor changes |
| `title-ui-handler` | Title screen context; menu options |
| `modal-ui-handler` | Modal title and button options |
| `abstract-settings-ui-handler` | Setting label and current value on navigate |
| `ui.ts` | Mode transition labels via `announceContext()` |
