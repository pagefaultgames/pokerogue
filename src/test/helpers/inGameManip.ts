import {getSettingNameWithKeycode} from "#app/configs/configHandler";
import {expect} from "vitest";
import {SettingInterface} from "#app/test/cfg_keyboard.example";

export class InGameManip {
    private config;
    private keycode;
    private settingName;
    private icon;
    constructor(config) {
        this.config = config;
        this.keycode = null;
        this.settingName = null;
        this.icon = null;
    }

    whenWePressOnKeyboard(keycode) {
        this.keycode = Phaser.Input.Keyboard.KeyCodes[keycode.toUpperCase()];
        return this;
    }

    nothingShouldHappen() {
        const settingName = getSettingNameWithKeycode(this.config, this.keycode);
        expect(settingName).toEqual(-1);
        return this;
    }

    normalizeSettingNameString(input) {
        // Convert the input string to lower case
        const lowerCasedInput = input.toLowerCase();

        // Replace underscores with spaces, capitalize the first letter of each word, and join them back with underscores
        const words = lowerCasedInput.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1));
        const result = words.join('_');

        return result;
    }

    weShouldTriggerTheButton(settingName) {
        this.settingName = SettingInterface[this.normalizeSettingNameString(settingName)];
        expect(getSettingNameWithKeycode(this.config, this.keycode)).toEqual(this.settingName);
        return this;
    }
}
