import type { UiMode } from "#enums/ui-mode";
import { SettingType } from "#system/settings";
import { AbstractSettingsUiHandler } from "#ui/abstract-settings-ui-handler";

export class SettingsAudioUiHandler extends AbstractSettingsUiHandler {
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
