import BattleScene from "../../battle-scene";
import { Mode } from "../ui";
"#app/inputs-controller.js";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import { SettingType } from "#app/system/settings/settings";

export default class SettingsAccessibilityUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode, SettingType.ACCESSIBILITY);
    this.title = "Accessibility";
    this.localStorageKey = "settings";
  }
}
