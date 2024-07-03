import BattleScene from "../../battle-scene";
import {addTextObject, TextStyle} from "../text";
import {Mode} from "../ui";
import {
  setSettingGamepad,
  SettingGamepad,
  settingGamepadBlackList,
  settingGamepadDefaults,
  settingGamepadOptions
} from "../../system/settings/settings-gamepad";
import pad_xbox360 from "#app/configs/inputs/pad_xbox360";
import pad_dualshock from "#app/configs/inputs/pad_dualshock";
import pad_unlicensedSNES from "#app/configs/inputs/pad_unlicensedSNES";
import {InterfaceConfig} from "#app/inputs-controller";
import AbstractControlSettingsUiHandler from "#app/ui/settings/abstract-control-settings-ui-handler.js";
import {Device} from "#enums/devices";
import {truncateString} from "#app/utils";

/**
 * Class representing the settings UI handler for gamepads.
 *
 * @extends AbstractControlSettingsUiHandler
 */

export default class SettingsGamepadUiHandler extends AbstractControlSettingsUiHandler {

  /**
     * Creates an instance of SettingsGamepadUiHandler.
     *
     * @param scene - The BattleScene instance.
     * @param mode - The UI mode, optional.
     */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.titleSelected = "Gamepad";
    this.setting = SettingGamepad;
    this.settingDeviceDefaults = settingGamepadDefaults;
    this.settingDeviceOptions = settingGamepadOptions;
    this.configs = [pad_xbox360, pad_dualshock, pad_unlicensedSNES];
    this.commonSettingsCount = 2;
    this.localStoragePropertyName = "settingsGamepad";
    this.settingBlacklisted = settingGamepadBlackList;
    this.device = Device.GAMEPAD;
  }

  setSetting = setSettingGamepad;

  /**
     * Setup UI elements.
     */
  setup() {
    super.setup();
    // If no gamepads are detected, set up a default UI prompt in the settings container.
    this.layout["noGamepads"] = new Map();
    const optionsContainer = this.scene.add.container(0, 0);
    optionsContainer.setVisible(false); // Initially hide the container as no gamepads are connected.
    const label = addTextObject(this.scene, 8, 28, "Please plug a controller or press a button", TextStyle.SETTINGS_LABEL);
    label.setOrigin(0, 0);
    optionsContainer.add(label);
    this.settingsContainer.add(optionsContainer);

    // Map the 'noGamepads' layout options for easy access.
    this.layout["noGamepads"].optionsContainer = optionsContainer;
    this.layout["noGamepads"].label = label;
  }

  /**
     * Set the layout for the active configuration.
     *
     * @param activeConfig - The active gamepad configuration.
     * @returns `true` if the layout was successfully applied, otherwise `false`.
     */
  setLayout(activeConfig: InterfaceConfig): boolean {
    // Check if there is no active configuration (e.g., no gamepad connected).
    if (!activeConfig) {
      // Retrieve the layout for when no gamepads are connected.
      const layout = this.layout["noGamepads"];
      // Make the options container visible to show message.
      layout.optionsContainer.setVisible(true);
      // Return false indicating the layout application was not successful due to lack of gamepad.
      return false;
    }

    return super.setLayout(activeConfig);
  }

  /**
     * Update the display of the chosen gamepad.
     */
  updateChosenGamepadDisplay(): void {
    // Update any bindings that might have changed since the last update.
    this.updateBindings();
    this.resetScroll();

    // Iterate over the keys in the settingDevice enumeration.
    for (const [index, key] of Object.keys(this.setting).entries()) {
      const setting = this.setting[key]; // Get the actual setting value using the key.

      // Check if the current setting corresponds to the controller setting.
      if (setting === this.setting.Controller) {
        // Iterate over all layouts excluding the 'noGamepads' special case.
        for (const _key of Object.keys(this.layout)) {
          if (_key === "noGamepads") {
            continue;
          } // Skip updating the no gamepad layout.

          // Update the text of the first option label under the current setting to the name of the chosen gamepad,
          // truncating the name to 30 characters if necessary.
          this.layout[_key].optionValueLabels[index][0].setText(truncateString(this.scene.inputController.selectedDevice[Device.GAMEPAD], 20));
        }
      }
    }
  }

  /**
     * Save the setting to local storage.
     *
     * @param settingName - The setting to save.
     * @param cursor - The cursor position to save.
     */
  saveSettingToLocalStorage(settingName, cursor): void {
    if (this.setting[settingName] !== this.setting.Controller) {
      this.scene.gameData.saveControlSetting(this.device, this.localStoragePropertyName, settingName, this.settingDeviceDefaults, cursor);
    }
  }
}
