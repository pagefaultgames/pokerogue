import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import cfg_keyboard_azerty from "#app/configs/cfg_keyboard_azerty";
import {SettingKeyboard, settingKeyboardDefaults, settingKeyboardOptions} from "#app/system/settings-keyboard";
import {reverseValueToKeySetting, truncateString} from "#app/utils";
import AbstractSettingsUiUiHandler from "#app/ui/settings/abstract-settings-ui-handler";
import {InterfaceConfig} from "#app/inputs-controller";
import {addTextObject, TextStyle} from "#app/ui/text";
import {deleteBind} from "#app/configs/configHandler";
import {Device} from "#app/enums/devices";

/**
 * Class representing the settings UI handler for keyboards.
 *
 * @extends AbstractSettingsUiUiHandler
 */
export default class SettingsKeyboardUiHandler extends AbstractSettingsUiUiHandler {
    /**
     * Creates an instance of SettingsKeyboardUiHandler.
     *
     * @param scene - The BattleScene instance.
     * @param mode - The UI mode, optional.
     */
    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
        this.titleSelected = 'Keyboard';
        this.settingDevice = SettingKeyboard;
        this.settingDeviceDefaults = settingKeyboardDefaults;
        this.settingDeviceOptions = settingKeyboardOptions;
        this.configs = [cfg_keyboard_azerty];
        this.commonSettingsCount = 1;
        this.textureOverride = 'keyboard';
        this.localStoragePropertyName = 'settingsKeyboard';

        const deleteEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
        deleteEvent.on('up', this.onDeleteDown, this);
    }

    /**
     * Setup UI elements.
     */
    setup() {
        super.setup();
        // If no gamepads are detected, set up a default UI prompt in the settings container.
        this.layout['noKeyboard'] = new Map();
        const optionsContainer = this.scene.add.container(0, 0);
        optionsContainer.setVisible(false); // Initially hide the container as no gamepads are connected.
        const label = addTextObject(this.scene, 8, 28, 'Please press a key on your keyboard', TextStyle.SETTINGS_LABEL);
        label.setOrigin(0, 0);
        optionsContainer.add(label);
        this.settingsContainer.add(optionsContainer);

        // Map the 'noKeyboard' layout options for easy access.
        this.layout['noKeyboard'].optionsContainer = optionsContainer;
        this.layout['noKeyboard'].label = label;
    }

    /**
     * Handle the delete key press event.
     */
    onDeleteDown(): void {
        const cursor = this.cursor + this.scrollCursor; // Calculate the absolute cursor position.
        const selection = this.settingLabels[cursor].text;
        const key = reverseValueToKeySetting(selection);
        const settingName = SettingKeyboard[key];
        const activeConfig = this.getActiveConfig();
        const success = deleteBind(this.getActiveConfig(), settingName);
        if (success) {
            this.saveCustomKeyboardMappingToLocalStorage(activeConfig);
            this.updateBindings();
        }
    }

    /**
     * Get the active configuration.
     *
     * @returns The active keyboard configuration.
     */
    getActiveConfig(): InterfaceConfig {
        return this.scene.inputController.getActiveConfig(Device.KEYBOARD);
    }

    /**
     * Get the keyboard settings from local storage.
     *
     * @returns The keyboard settings from local storage.
     */
    getLocalStorageSetting(): object {
        // Retrieve the gamepad settings from local storage or use an empty object if none exist.
        const settings: object = localStorage.hasOwnProperty('settingsKeyboard') ? JSON.parse(localStorage.getItem('settingsKeyboard')) : {};
        return settings;
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
            const layout = this.layout['noKeyboard'];
            // Make the options container visible to show message.
            layout.optionsContainer.setVisible(true);
            // Return false indicating the layout application was not successful due to lack of gamepad.
            return false;
        }

        return super.setLayout(activeConfig);
    }

    /**
     * Navigate to the left menu tab.
     *
     * @returns `true` indicating the navigation was successful.
     */
    navigateMenuLeft(): boolean {
        this.scene.ui.setMode(Mode.SETTINGS_GAMEPAD)
        return true;
    }

    /**
     * Navigate to the right menu tab.
     *
     * @returns `true` indicating the navigation was successful.
     */
    navigateMenuRight(): boolean {
        this.scene.ui.setMode(Mode.SETTINGS)
        return true;
    }

    /**
     * Update the display of the chosen keyboard layout.
     */
    updateChosenKeyboardDisplay(): void {
        // Update any bindings that might have changed since the last update.
        this.updateBindings();

        // Iterate over the keys in the settingDevice enumeration.
        for (const [index, key] of Object.keys(this.settingDevice).entries()) {
            const setting = this.settingDevice[key] // Get the actual setting value using the key.

            // Check if the current setting corresponds to the default controller setting.
            if (setting === this.settingDevice.Default_Layout) {
                // Iterate over all layouts excluding the 'noGamepads' special case.
                for (const _key of Object.keys(this.layout)) {
                    if (_key === 'noKeyboard') continue; // Skip updating the no gamepad layout.
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
        if (this.settingDevice[settingName] !== this.settingDevice.Default_Layout)
            this.scene.gameData.saveKeyboardSetting(settingName, cursor)
    }
}