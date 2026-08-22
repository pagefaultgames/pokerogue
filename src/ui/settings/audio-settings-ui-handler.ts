import { BaseSettingsUiHandler } from "#ui/base-settings-ui-handler";
import { audioSettingsUiItems } from "#ui/settings-ui-items";

export class SettingsAudioUiHandler extends BaseSettingsUiHandler {
  constructor() {
    super("audio", audioSettingsUiItems);

    this.rowsToDisplay = 6;
  }
}
