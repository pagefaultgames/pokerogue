import { UiMode } from "#enums/ui-mode";

/** All modes that are part of the settings UI. */
export const SETTINGS_UI_MODES: readonly UiMode[] = [
  UiMode.SETTINGS,
  UiMode.SETTINGS_AUDIO,
  UiMode.SETTINGS_DISPLAY,
  UiMode.SETTINGS_KEYBOARD,
  UiMode.KEYBOARD_BINDING,
  UiMode.SETTINGS_GAMEPAD,
  UiMode.GAMEPAD_BINDING,
] as const;
