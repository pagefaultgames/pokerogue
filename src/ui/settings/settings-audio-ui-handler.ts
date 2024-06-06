import BattleScene from "../../battle-scene";
import { Mode } from "../ui";
"#app/inputs-controller.js";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import { Setting, SettingType } from "#app/system/settings/settings";

export default class SettingsAudioUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.title = "Audio";
    this.settings = Setting.filter(s => s.type === SettingType.AUDIO);
    this.localStorageKey = "settings";
  }
}
