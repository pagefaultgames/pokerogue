import { SettingType } from "../../system/settings/settings";
import type { UiMode } from "#enums/ui-mode";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";

export default class SettingsUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param mode - The UI mode, optional.
   */
  constructor(mode: UiMode | null = null) {
    super(SettingType.GENERAL, mode);
    this.title = "General";
    this.localStorageKey = "settings";
  }
}
