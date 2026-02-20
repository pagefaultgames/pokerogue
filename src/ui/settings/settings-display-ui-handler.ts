import type { UiMode } from "#enums/ui-mode";
import { SettingKeys, SettingType } from "#system/settings";
import { AbstractSettingsUiHandler } from "#ui/abstract-settings-ui-handler";
import i18next from "i18next";

export class SettingsDisplayUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param mode - The UI mode, optional.
   */
  constructor(mode: UiMode | null = null) {
    super(SettingType.DISPLAY, mode);
    this.title = "Display";

    /**
     * Update to current language from default value.
     * - default value is 'English'
     */
    const languageIndex = this.settings.findIndex(s => s.key === SettingKeys.Language);
    if (languageIndex >= 0) {
      // const label = i18next.t("settings:languageLabel");
      const label = this.getRawLangValue(i18next.t("settings:languageLabel"));
      const value = this.getRawLangValue(label);
      this.settings[languageIndex].options[0] = {
        value,
        label,
      };
    }

    this.localStorageKey = "settings";
  }

  /**
   *
   * @param langLabel Default languageLabel to cleanup
   * @returns
   */
  private getRawLangValue(langLabel: string) {
    return langLabel.replace("(Needs Help)", "").trimEnd();
  }
}
