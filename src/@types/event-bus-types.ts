import type { AnySettingKey, SettingsCategory } from "#types/settings";

export type InputsEvent = "keyboard/init" | "gamepad/init";

export type SettingsEvent = "settings/update/success" | "settings/update/failed" | "settings/saved";

export type TouchControlsEvent =
  | "touchControls/move/start"
  | "touchControls/move/end"
  | "touchControls/move/save"
  | "touchControls/move/cancel"
  | "touchControls/move/reset";

export type AnyEvent = InputsEvent | SettingsEvent | TouchControlsEvent;

export interface SettingsUpdateEventArgs {
  category: SettingsCategory;
  key: AnySettingKey;
  value: string | number | boolean;
}

export type EventCallbackFn<D> = (data: D) => void;
