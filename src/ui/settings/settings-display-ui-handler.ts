import type { UiMode } from "#enums/ui-mode";
import { SettingKeys, SettingType } from "#system/settings";
import { AbstractSettingsUiHandler } from "#ui/abstract-settings-ui-handler";

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
      const currentLocale = localStorage.getItem("prLang");
      switch (currentLocale) {
        case "en":
          this.settings[languageIndex].options[0] = {
            value: "English",
            label: "English",
          };
          break;
        case "es-ES":
          this.settings[languageIndex].options[0] = {
            value: "Español (ES)",
            label: "Español (ES)",
          };
          break;
        case "es-MX":
          this.settings[languageIndex].options[0] = {
            value: "Español (LATAM)",
            label: "Español (LATAM)",
          };
          break;
        case "fr":
          this.settings[languageIndex].options[0] = {
            value: "Français",
            label: "Français",
          };
          break;
        case "de":
          this.settings[languageIndex].options[0] = {
            value: "Deutsch",
            label: "Deutsch",
          };
          break;
        case "it":
          this.settings[languageIndex].options[0] = {
            value: "Italiano",
            label: "Italiano",
          };
          break;
        case "pt-BR":
          this.settings[languageIndex].options[0] = {
            value: "Português (BR)",
            label: "Português (BR)",
          };
          break;
        case "ko":
        case "ko-KR":
          this.settings[languageIndex].options[0] = {
            value: "한국어",
            label: "한국어",
          };
          break;
        case "ja":
          this.settings[languageIndex].options[0] = {
            value: "日本語",
            label: "日本語",
          };
          break;
        case "zh-CN":
          this.settings[languageIndex].options[0] = {
            value: "简体中文",
            label: "简体中文",
          };
          break;
        case "zh-TW":
          this.settings[languageIndex].options[0] = {
            value: "繁體中文",
            label: "繁體中文",
          };
          break;
        case "ca":
          this.settings[languageIndex].options[0] = {
            value: "Català",
            label: "Català (Needs Help)",
          };
          break;
        case "tr":
          this.settings[languageIndex].options[0] = {
            value: "Türkçe",
            label: "Türkçe (Needs Help)",
          };
          break;
        case "ru":
          this.settings[languageIndex].options[0] = {
            value: "Русский",
            label: "Русский (Needs Help)",
          };
          break;
        case "da":
          this.settings[languageIndex].options[0] = {
            value: "Dansk",
            label: "Dansk (Needs Help)",
          };
          break;
        case "ro":
          this.settings[languageIndex].options[0] = {
            value: "Română",
            label: "Română (Needs Help)",
          };
          break;
        case "tl":
          this.settings[languageIndex].options[0] = {
            value: "Tagalog",
            label: "Tagalog (Needs Help)",
          };
          break;
        default:
          this.settings[languageIndex].options[0] = {
            value: "English",
            label: "English",
          };
          break;
      }
    }

    this.localStorageKey = "settings";
  }
}
