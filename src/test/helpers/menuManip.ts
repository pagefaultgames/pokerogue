import {SettingInterface} from "#app/test/cfg_keyboard.example";
import {expect} from "vitest";
import {Button} from "#app/enums/buttons";
import {
    deleteBind,
    getIconWithKey,
    getIconWithKeycode,
    getIconWithSettingName,
    getKeyWithKeycode, getKeyWithSettingName, getKeySolvingConflict, swap
} from "#app/configs/configHandler";

export class MenuManip {
    private config;
    private settingName;
    private keycode;
    private icon;
    private iconDisplayed;
    private specialCaseIcon;

    constructor(config) {
        this.config = config;
        this.settingName = null;
        this.icon = null;
        this.iconDisplayed = null;
        this.specialCaseIcon = null;
    }

    convertNameToButtonString(input) {
        // Check if the input starts with "Alt_Button"
        if (input.startsWith("Alt_Button")) {
            // Return the last part in uppercase
            return input.split('_').pop().toUpperCase();
        }

        // Split the input string by underscore
        const parts = input.split('_');

        // Skip the first part and join the rest with an underscore
        const result = parts.slice(1).map(part => part.toUpperCase()).join('_');

        return result;
    }

    whenCursorIsOnSetting(settingName) {
        this.settingName = SettingInterface[settingName];
        const buttonName = this.convertNameToButtonString(settingName);
        expect(this.config.settings[this.settingName]).toEqual(Button[buttonName]);
        return this;
    }

    iconDisplayedIs(icon) {
        this.iconDisplayed = this.config.icons[icon];
        expect(getIconWithSettingName(this.config, this.settingName)).toEqual(this.iconDisplayed);
        return this;
    }

    thereShouldBeNoIconAnymore() {
        const icon = getIconWithSettingName(this.config, this.settingName);
        expect(icon === undefined).toEqual(true);
        return this;
    }

    thereShouldBeNoIcon() {
        return this.thereShouldBeNoIconAnymore();
    }

    weWantThisBindInstead(keycode) {
        this.keycode = Phaser.Input.Keyboard.KeyCodes[keycode];
        const icon = getIconWithKeycode(this.config, this.keycode);
        const key = getKeyWithKeycode(this.config, this.keycode);
        const _keys = key.toLowerCase().split("_");
        const iconIdentifier = _keys[_keys.length-1];
        expect(icon.toLowerCase().includes(iconIdentifier)).toEqual(true);
        return this;
    }

    OopsSpecialCaseIcon(icon) {
        this.specialCaseIcon = this.config.icons[icon];
        const potentialExistingKey = getKeySolvingConflict(this.config, this.keycode, this.settingName);
        const prev_key = potentialExistingKey || getKeyWithSettingName(this.config, this.settingName);
        expect(getIconWithKey(this.config, prev_key)).toEqual(this.specialCaseIcon);
        return this;
    }

    whenWeDelete(settingName?: string) {
        this.settingName = SettingInterface[settingName] || this.settingName;
        const key = getKeyWithSettingName(this.config, this.settingName);
        deleteBind(this.config, this.settingName);
        expect(this.config.custom[key]).toEqual(-1);
        return this;
    }

    confirm() {
        swap(this.config, this.settingName, this.keycode);
    }
}
