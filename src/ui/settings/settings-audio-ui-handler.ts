import type { UiMode } from "#enums/ui-mode";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import { SettingType } from "#app/system/settings/settings";
("#app/inputs-controller");

export default class SettingsAudioUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsAudioUiHandler.
   *
   * @param mode - The UI mode, optional.
   */
  constructor(mode: UiMode | null = null) {
    super(SettingType.AUDIO, mode);
    this.title = "Audio";
    this.localStorageKey = "settings";
    this.rowsToDisplay = 6;
  }
}
