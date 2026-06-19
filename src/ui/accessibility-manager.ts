import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import { getKeyWithSettingName } from "#inputs/config-handler";
import { SettingGamepad } from "#system/settings-gamepad";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { MappingSettingName } from "#types/configs/inputs";
import i18next from "i18next";

/**
 * AccessibilityManager - Provides screen reader support for the canvas-based game.
 *
 * Creates a hidden DOM layer with ARIA live regions that mirrors game state,
 * allowing NVDA and other screen readers to announce battle text, menu options,
 * and cursor changes.
 *
 * Use the exported {@linkcode a11yManager} singleton rather than constructing this directly.
 */
class AccessibilityManager {
  private rootEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private contextEl: HTMLElement | null = null;
  private menuEl: HTMLElement | null = null;

  private announceCounter = 0;
  private enabled = true;

  /**
   * Initialize the accessibility DOM layer inside #app.
   * Call once after the Phaser game is created.
   */
  init(): void {
    const app = document.getElementById("app");
    if (!app || this.rootEl) {
      return;
    }

    this.rootEl = document.createElement("div");
    this.rootEl.id = "a11y-root";
    this.rootEl.className = "sr-only";
    this.rootEl.setAttribute("aria-relevant", "additions text");

    // Message region: battle messages, dialogue (assertive = interrupts current speech)
    this.messageEl = document.createElement("div");
    this.messageEl.id = "a11y-message";
    this.messageEl.setAttribute("role", "log");
    this.messageEl.setAttribute("aria-live", "assertive");
    this.messageEl.setAttribute("aria-atomic", "true");

    // Context region: mode transitions, status info (polite = waits for current speech)
    this.contextEl = document.createElement("div");
    this.contextEl.id = "a11y-context";
    this.contextEl.setAttribute("role", "status");
    this.contextEl.setAttribute("aria-live", "polite");
    this.contextEl.setAttribute("aria-atomic", "true");

    // Menu region: current menu options
    this.menuEl = document.createElement("div");
    this.menuEl.id = "a11y-menu";
    this.menuEl.setAttribute("role", "menu");
    this.menuEl.setAttribute("aria-label", i18next.t("accessibility:menu"));

    this.rootEl.appendChild(this.messageEl);
    this.rootEl.appendChild(this.contextEl);
    this.rootEl.appendChild(this.menuEl);
    app.appendChild(this.rootEl);

    // Ensure the game canvas is focusable for screen readers
    const canvas = app.querySelector("canvas");
    if (canvas) {
      canvas.setAttribute("tabindex", "0");
      canvas.setAttribute("aria-label", i18next.t("accessibility:gameWindow"));
    }

    // Also make #app focusable and auto-focus it so screen readers pick up the live regions
    app.setAttribute("tabindex", "-1");
    app.focus();
  }

  /**
   * Announce a message to screen readers immediately (assertive).
   * Used for battle messages, dialogue, cursor changes.
   */
  announceMessage(text: string): void {
    if (!this.enabled || !this.messageEl || !text) {
      return;
    }

    const cleanText = this.stripFormatting(text);
    if (!cleanText) {
      return;
    }

    // Toggle zero-width space to force NVDA to re-read identical consecutive messages
    this.announceCounter++;
    this.messageEl.textContent = cleanText + "​".repeat(this.announceCounter % 2);
  }

  /**
   * Announce context/status information (polite - waits for current speech).
   * Used for mode transitions.
   */
  announceContext(text: string): void {
    if (!this.enabled || !this.contextEl || !text) {
      return;
    }
    this.contextEl.textContent = text;
  }

  /**
   * Build an accessible menu from a list of item labels.
   */
  setMenu(items: string[], cursorIndex: number, label?: string): void {
    if (!this.enabled || !this.menuEl) {
      return;
    }

    if (label) {
      this.menuEl.setAttribute("aria-label", label);
    }

    this.menuEl.innerHTML = "";
    items.forEach((item, i) => {
      const el = document.createElement("div");
      el.setAttribute("role", "menuitem");
      el.textContent = this.stripFormatting(item);
      if (i === cursorIndex) {
        el.setAttribute("aria-current", "true");
      }
      this.menuEl!.appendChild(el);
    });
  }

  /**
   * Update cursor position in the accessible menu and announce the selected item.
   */
  updateMenuCursor(index: number): void {
    if (!this.enabled || !this.menuEl) {
      return;
    }

    const items = this.menuEl.querySelectorAll('[role="menuitem"]');
    items.forEach((el, i) => {
      if (i === index) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });

    if (items[index]) {
      this.announceMessage(items[index].textContent ?? "");
    }
  }

  /**
   * Clear the menu region.
   */
  clearMenu(): void {
    if (this.menuEl) {
      this.menuEl.innerHTML = "";
    }
  }

  /**
   * Clear all accessibility regions.
   */
  clearAll(): void {
    if (this.messageEl) {
      this.messageEl.textContent = "";
    }
    if (this.contextEl) {
      this.contextEl.textContent = "";
    }
    this.clearMenu();
  }

  /**
   * Enable or disable screen reader announcements.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.rootEl) {
      this.rootEl.setAttribute("aria-hidden", (!enabled).toString());
    }
  }

  /**
   * Strip BBCode formatting tags and action patterns from text.
   * Removes [color=...], [shadow=...], [/color], [/shadow] and @c{}, @d{}, @s{}, @f{} patterns.
   */
  private stripFormatting(text: string): string {
    return text
      .replace(/\[\/?\w+(?:=[^\]]+)?\]/g, "") // BBCode tags
      .replace(/@[cdsf]\{.*?\}/g, "") // Action patterns
      .trim();
  }
}

/**
 * Singleton accessibility manager. Use this rather than constructing
 * {@linkcode AccessibilityManager} directly.
 */
export const a11yManager = new AccessibilityManager();

const KEYBOARD_BUTTON_TO_SETTING: Partial<Record<Button, SettingKeyboard>> = {
  [Button.UP]: SettingKeyboard.BUTTON_UP,
  [Button.DOWN]: SettingKeyboard.BUTTON_DOWN,
  [Button.LEFT]: SettingKeyboard.BUTTON_LEFT,
  [Button.RIGHT]: SettingKeyboard.BUTTON_RIGHT,
  [Button.SUBMIT]: SettingKeyboard.BUTTON_SUBMIT,
  [Button.ACTION]: SettingKeyboard.BUTTON_ACTION,
  [Button.CANCEL]: SettingKeyboard.BUTTON_CANCEL,
  [Button.MENU]: SettingKeyboard.BUTTON_MENU,
  [Button.STATS]: SettingKeyboard.BUTTON_STATS,
  [Button.CYCLE_SHINY]: SettingKeyboard.BUTTON_CYCLE_SHINY,
  [Button.CYCLE_FORM]: SettingKeyboard.BUTTON_CYCLE_FORM,
  [Button.CYCLE_GENDER]: SettingKeyboard.BUTTON_CYCLE_GENDER,
  [Button.CYCLE_ABILITY]: SettingKeyboard.BUTTON_CYCLE_ABILITY,
  [Button.CYCLE_NATURE]: SettingKeyboard.BUTTON_CYCLE_NATURE,
  [Button.CYCLE_TERA]: SettingKeyboard.BUTTON_CYCLE_TERA,
  [Button.SPEED_UP]: SettingKeyboard.BUTTON_SPEED_UP,
  [Button.SLOW_DOWN]: SettingKeyboard.BUTTON_SLOW_DOWN,
};

const GAMEPAD_BUTTON_TO_SETTING: Partial<Record<Button, SettingGamepad>> = {
  [Button.UP]: SettingGamepad.BUTTON_UP,
  [Button.DOWN]: SettingGamepad.BUTTON_DOWN,
  [Button.LEFT]: SettingGamepad.BUTTON_LEFT,
  [Button.RIGHT]: SettingGamepad.BUTTON_RIGHT,
  [Button.SUBMIT]: SettingGamepad.BUTTON_SUBMIT,
  [Button.ACTION]: SettingGamepad.BUTTON_ACTION,
  [Button.CANCEL]: SettingGamepad.BUTTON_CANCEL,
  [Button.MENU]: SettingGamepad.BUTTON_MENU,
  [Button.STATS]: SettingGamepad.BUTTON_STATS,
  [Button.CYCLE_SHINY]: SettingGamepad.BUTTON_CYCLE_SHINY,
  [Button.CYCLE_FORM]: SettingGamepad.BUTTON_CYCLE_FORM,
  [Button.CYCLE_GENDER]: SettingGamepad.BUTTON_CYCLE_GENDER,
  [Button.CYCLE_ABILITY]: SettingGamepad.BUTTON_CYCLE_ABILITY,
  [Button.CYCLE_NATURE]: SettingGamepad.BUTTON_CYCLE_NATURE,
  [Button.CYCLE_TERA]: SettingGamepad.BUTTON_CYCLE_TERA,
  [Button.SPEED_UP]: SettingGamepad.BUTTON_SPEED_UP,
  [Button.SLOW_DOWN]: SettingGamepad.BUTTON_SLOW_DOWN,
};

/**
 * Strip the `KEY_` / `BUTTON_` prefix and replace underscores with spaces so the
 * label reads naturally for a screen reader (e.g. `KEY_ARROW_UP` -> `ARROW UP`).
 */
function normalizeKeyName(name: string | undefined): string {
  if (!name) {
    return "";
  }
  return name.replace(/^(KEY_|BUTTON_)/, "").replaceAll("_", " ");
}

function resolveKeyboardLabel(button: Button): string | undefined {
  const inputController = globalScene?.inputController;
  if (!inputController) {
    return;
  }
  const keyboardConfig = inputController.getActiveConfig(Device.KEYBOARD);
  const setting = KEYBOARD_BUTTON_TO_SETTING[button];
  if (!keyboardConfig || !setting) {
    return;
  }
  const primary = getKeyWithSettingName(keyboardConfig, setting);
  if (primary) {
    return normalizeKeyName(primary);
  }
  const altSetting = `ALT_${setting}` as MappingSettingName;
  const alt = getKeyWithSettingName(keyboardConfig, altSetting as SettingKeyboard);
  return alt ? normalizeKeyName(alt) : undefined;
}

function resolveGamepadLabel(button: Button): string | undefined {
  const inputController = globalScene?.inputController;
  if (!inputController) {
    return;
  }
  const gamepadConfig = inputController.getActiveConfig(Device.GAMEPAD);
  const padSetting = GAMEPAD_BUTTON_TO_SETTING[button];
  if (!gamepadConfig || !padSetting) {
    return;
  }
  const primary = getKeyWithSettingName(gamepadConfig, padSetting);
  return primary ? normalizeKeyName(primary) : undefined;
}

/**
 * Resolve a human-readable label for the key currently bound to {@linkcode button}.
 *
 * Prioritizes whichever device the user last interacted with (keyboard or gamepad)
 * via `inputController.getLastSourceDevice()`, then falls back to the other device.
 * This way a player who just pressed an Xbox A button hears "A" rather than the
 * keyboard binding for the same Button.ACTION, and a keyboard player still hears
 * "SPACE" / "Z" even when a gamepad is connected.
 *
 * Returns an empty string if no binding is found on either device - callers should
 * fall back to a generic phrase like "the action button" via the `*NoKey` locale
 * variants.
 */
export function getKeyLabelForButton(button: Button): string {
  const inputController = globalScene?.inputController;
  if (!inputController) {
    return "";
  }

  const lastDevice = inputController.getLastSourceDevice();
  if (lastDevice === Device.GAMEPAD) {
    return resolveGamepadLabel(button) ?? resolveKeyboardLabel(button) ?? "";
  }
  return resolveKeyboardLabel(button) ?? resolveGamepadLabel(button) ?? "";
}
