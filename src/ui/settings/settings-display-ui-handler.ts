import BattleScene from "../../battle-scene";
import { Mode } from "../ui";
"#app/inputs-controller.js";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import { Setting, SettingKeys, SettingType } from "#app/system/settings/settings";

export default class SettingsDisplayUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.title = "Display";
    this.settings = Setting.filter(s => s.type === SettingType.DISPLAY);

    /**
     * Update to current language from default value.
     * - default value is 'English'
     */
    const languageIndex = this.settings.findIndex(s => s.key === SettingKeys.Language);
    if (languageIndex >= 0) {
      const currentLocale = localStorage.getItem("prLang");
      switch (currentLocale) {
      case "en":
        this.settings[languageIndex].options[0] = "English";
        break;
      case "es":
        this.settings[languageIndex].options[0] = "Español";
        break;
      case "it":
        this.settings[languageIndex].options[0] = "Italiano";
        break;
      case "fr":
        this.settings[languageIndex].options[0] = "Français";
        break;
      case "de":
        this.settings[languageIndex].options[0] = "Deutsch";
        break;
      case "pt-BR":
        this.settings[languageIndex].options[0] = "Português (BR)";
        break;
      case "zh-CN":
        this.settings[languageIndex].options[0] = "简体中文";
        break;
      case "zh-TW":
        this.settings[languageIndex].options[0] = "繁體中文";
        break;
      case "ko":
        this.settings[languageIndex].options[0] = "한국어";
        break;
      default:
        this.settings[languageIndex].options[0] = "English";
        break;
      }
    }

    this.localStorageKey = "settings";
  }
}
