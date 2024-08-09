import BattleScene from "../../battle-scene";
import { SettingType } from "../../system/settings/settings";
import { Mode } from "../ui";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";

export default class SettingsUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, SettingType.GENERAL, mode);
    this.title = "General";
    this.localStorageKey = "settings";
  }
}
