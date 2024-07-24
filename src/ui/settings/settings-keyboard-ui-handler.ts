import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import cfg_keyboard_qwerty from "#app/configs/inputs/cfg_keyboard_qwerty";
import {
  setSettingKeyboard,
  SettingKeyboard,
  settingKeyboardBlackList,
  settingKeyboardDefaults,
  settingKeyboardOptions
} from "#app/system/settings/settings-keyboard";
import {reverseValueToKeySetting, truncateString} from "#app/utils";
import AbstractControlSettingsUiHandler from "#app/ui/settings/abstract-control-settings-ui-handler.js";
import {InterfaceConfig} from "#app/inputs-controller";
import {addTextObject, TextStyle} from "#app/ui/text";
import {deleteBind} from "#app/configs/inputs/configHandler";
import {Device} from "#enums/devices";
import {NavigationManager} from "#app/ui/settings/navigationMenu";
import i18next from "i18next";

/**
 * Class representing the settings UI handler for keyboards.
 *
 * @extends AbstractControlSettingsUiHandler
 */
export default class SettingsKeyboardUiHandler extends AbstractControlSettingsUiHandler {
  /**
     * Creates an instance of SettingsKeyboardUiHandler.
     *
     * @param scene - The BattleScene instance.
     * @param mode - The UI mode, optional.
     */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.titleSelected = "Keyboard";
    this.setting = SettingKeyboard;
    this.settingDeviceDefaults = settingKeyboardDefaults;
    this.settingDeviceOptions = settingKeyboardOptions;
    this.configs = [cfg_keyboard_qwerty];
    this.commonSettingsCount = 0;
    this.textureOverride = "keyboard";
    this.localStoragePropertyName = "settingsKeyboard";
    this.settingBlacklisted = settingKeyboardBlackList;
    this.device = Device.KEYBOARD;

    const deleteEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    const restoreDefaultEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.HOME);
    deleteEvent.on("up", this.onDeleteDown, this);
    restoreDefaultEvent.on("up", this.onHomeDown, this);
  }

  setSetting = setSettingKeyboard;

  /**
     * Setup UI elements.
     */
  setup() {
    super.setup();
    // If no gamepads are detected, set up a default UI prompt in the settings container.
    this.layout["noKeyboard"] = new Map();
    const optionsContainer = this.scene.add.container(0, 0);
    optionsContainer.setVisible(false); // Initially hide the container as no gamepads are connected.
    const label = addTextObject(this.scene, 8, 28, i18next.t("settings:keyboardPleasePress"), TextStyle.SETTINGS_LABEL);
    label.setOrigin(0, 0);
    optionsContainer.add(label);
    this.settingsContainer.add(optionsContainer);

    const iconDelete = this.scene.add.sprite(0, 0, "keyboard");
    iconDelete.setOrigin(0, -0.1);
    iconDelete.setPositionRelative(this.actionsBg, this.navigationContainer.width - 260, 4);
    this.navigationIcons["BUTTON_DELETE"] = iconDelete;

    const deleteText = addTextObject(this.scene, 0, 0, i18next.t("settings:delete"), TextStyle.SETTINGS_LABEL);
    deleteText.setOrigin(0, 0.15);
    deleteText.setPositionRelative(iconDelete, -deleteText.width/6-2, 0);

    this.settingsContainer.add(iconDelete);
    this.settingsContainer.add(deleteText);



    // Map the 'noKeyboard' layout options for easy access.
    this.layout["noKeyboard"].optionsContainer = optionsContainer;
    this.layout["noKeyboard"].label = label;
  }

  /**
     * Handle the home key press event.
     */
  onHomeDown(): void {
    if (![Mode.SETTINGS_KEYBOARD, Mode.SETTINGS_GAMEPAD].includes(this.scene.ui.getMode())) {
      return;
    }
    this.scene.gameData.resetMappingToFactory();
    NavigationManager.getInstance().updateIcons();
  }

  /**
     * Handle the delete key press event.
     */
  onDeleteDown(): void {
    if (this.scene.ui.getMode() !== Mode.SETTINGS_KEYBOARD) {
      return;
    }
    const cursor = this.cursor + this.scrollCursor; // Calculate the absolute cursor position.
    const selection = this.settingLabels[cursor].text;
    const key = reverseValueToKeySetting(selection);
    const settingName = SettingKeyboard[key];
    const activeConfig = this.getActiveConfig();
    const success = deleteBind(this.getActiveConfig(), settingName);
    if (success) {
      this.saveCustomKeyboardMappingToLocalStorage(activeConfig);
      this.updateBindings();
      NavigationManager.getInstance().updateIcons();
    }
  }

  /**
     * Set the layout for the active configuration.
     *
     * @param activeConfig - The active keyboard configuration.
     * @returns `true` if the layout was successfully applied, otherwise `false`.
     */
  setLayout(activeConfig: InterfaceConfig): boolean {
    // Check if there is no active configuration (e.g., no gamepad connected).
    if (!activeConfig) {
      // Retrieve the layout for when no gamepads are connected.
      const layout = this.layout["noKeyboard"];
      // Make the options container visible to show message.
      layout.optionsContainer.setVisible(true);
      // Return false indicating the layout application was not successful due to lack of gamepad.
      return false;
    }

    return super.setLayout(activeConfig);
  }

  /**
     * Update the display of the chosen keyboard layout.
     */
  updateChosenKeyboardDisplay(): void {
    // Update any bindings that might have changed since the last update.
    this.updateBindings();

    // Iterate over the keys in the settingDevice enumeration.
    for (const [index, key] of Object.keys(this.setting).entries()) {
      const setting = this.setting[key]; // Get the actual setting value using the key.

      // Check if the current setting corresponds to the layout setting.
      if (setting === this.setting.Default_Layout) {
        // Iterate over all layouts excluding the 'noGamepads' special case.
        for (const _key of Object.keys(this.layout)) {
          if (_key === "noKeyboard") {
            continue;
          } // Skip updating the no gamepad layout.
          // Update the text of the first option label under the current setting to the name of the chosen gamepad,
          // truncating the name to 30 characters if necessary.
          this.layout[_key].optionValueLabels[index][0].setText(truncateString(this.scene.inputController.selectedDevice[Device.KEYBOARD], 22));
        }
      }
    }

  }

  /**
     * Save the custom keyboard mapping to local storage.
     *
     * @param config - The configuration to save.
     */
  saveCustomKeyboardMappingToLocalStorage(config): void {
    this.scene.gameData.saveMappingConfigs(this.scene.inputController?.selectedDevice[Device.KEYBOARD], config);
  }

  /**
     * Save the setting to local storage.
     *
     * @param settingName - The name of the setting to save.
     * @param cursor - The cursor position to save.
     */
  saveSettingToLocalStorage(settingName, cursor): void {
    if (this.setting[settingName] !== this.setting.Default_Layout) {
      this.scene.gameData.saveControlSetting(this.device, this.localStoragePropertyName, settingName, this.settingDeviceDefaults, cursor);
    }
  }
}
