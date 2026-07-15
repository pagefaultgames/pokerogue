import type { UiMode } from "#enums/ui-mode";
import { SettingType } from "#system/settings";
import { BaseSettingsUiHandler } from "#ui/base-settings-ui-handler";

export class SettingsUiHandler extends BaseSettingsUiHandler {
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
