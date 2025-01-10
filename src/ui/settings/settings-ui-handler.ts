import { SettingType } from "../../system/settings/settings";
import type { Mode } from "../ui";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";

export default class SettingsUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param mode - The UI mode, optional.
   */
  constructor(mode: Mode | null = null) {
    super(SettingType.GENERAL, mode);
    this.title = "General";
    this.localStorageKey = "settings";
  }
}
