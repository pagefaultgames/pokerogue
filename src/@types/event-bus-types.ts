export type InputsEvent = "keyboard/init" | "gamepad/init";

export type LanguageEvent = "language/change";

export type SettingsEvent = "settings/updated" | "settings/update/failed" | "settings/saved";

export type TouchControlsEvent =
  | "touchControls/move/start"
  | "touchControls/move/end"
  | "touchControls/move/save"
  | "touchControls/move/cancel"
  | "touchControls/move/reset";
