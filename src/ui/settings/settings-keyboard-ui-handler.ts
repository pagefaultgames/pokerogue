import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import cfg_keyboard_azerty from "#app/configs/cfg_keyboard_azerty";
import {SettingKeyboard, settingKeyboardDefaults, settingKeyboardOptions} from "#app/system/settings-keyboard";
import {truncateString} from "#app/utils";
import AbstractSettingsUiUiHandler from "#app/ui/settings/abstract-settings-ui-handler";


export default class SettingsKeyboardUiHandler extends AbstractSettingsUiUiHandler {
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
    }

    getActiveConfig() {
        return this.scene.inputController.getActiveKeyboardConfig();
    }

    getLocalStorageSetting(): object {
        // Retrieve the gamepad settings from local storage or use an empty object if none exist.
        const settings: object = localStorage.hasOwnProperty('settingsKeyboard') ? JSON.parse(localStorage.getItem('settingsKeyboard')) : {};
        return settings;
    }

    navigateMenuLeft(): boolean {
        this.scene.ui.setMode(Mode.SETTINGS_GAMEPAD)
        return true;
    }

    navigateMenuRight(): boolean {
        this.scene.ui.setMode(Mode.SETTINGS)
        return true;
    }

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
                    // Update the text of the first option label under the current setting to the name of the chosen gamepad,
                    // truncating the name to 30 characters if necessary.
                    this.layout[_key].optionValueLabels[index][0].setText(truncateString(this.scene.inputController.chosenKeyboard, 30));
                }
            }
        }

    }

    saveSettingToLocalStorage(setting, cursor): void {
        if (this.settingDevice[setting] !== this.settingDevice.Default_Layout)
            this.scene.gameData.saveKeyboardSetting(setting, cursor)
    }
}