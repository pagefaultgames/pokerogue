import BattleScene from "../../battle-scene";
import { Mode } from "../ui";
"#app/inputs-controller.js";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import { SettingType } from "#app/system/settings/settings";

export default class SettingsDisplayUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsDisplayUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, SettingType.DISPLAY, mode);
    this.title = "Display";
    this.localStorageKey = "settings";
  }
}
