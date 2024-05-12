import {GamepadConfig} from "../inputs-controller";
import {SettingGamepad} from "#app/system/settings-gamepad";
import {Button} from "#app/enums/buttons";


// Given a button index from an input event, return its naming from the mapping config
export function getKeyFromInputIndex(config: GamepadConfig, index: number): String | null {
    for (const key of Object.keys(config.gamepadMapping)) {
        if (config.gamepadMapping[key] === index) return key;
    }
    return null;
}

// Given a setting name, return the key assigned to it from the config file
export function getKeyForSettingName(config: GamepadConfig, settingName: string): String | null {
    for (const key of Object.keys(config.setting)) {
        if (config.setting[key] === settingName) return key;
    }
    return null;
}

// Given a Button, return the custom key assigned to it from the config file
export function getCurrenlyAssignedKeyToAction(config: GamepadConfig, action: Button): String | null {
    for (const key of Object.keys(config.custom)) {
        if (config.custom[key] === action) return key;
    }
    return null;
}

// Given a setting name, return the custom key for the default action from the config file
export function getCurrentlyAssignedToSettingName(config: GamepadConfig, settingName: string): String {
    const oldKey = getKeyForSettingName(config, settingName)
    const action = config.default[oldKey];
    const key = getCurrenlyAssignedKeyToAction(config, action);
    return key;
}

// Given a button index from an input event, return its icon from the config file
export function getCurrenlyAssignedIconFromInputIndex(config: GamepadConfig, index: number): String {
    const key = getKeyFromInputIndex(config, index);
    return config.icons[key];
}

// Given a setting name, return the icon currently assigned to this setting name
export function getCurrentlyAssignedIconToSettingName(config: GamepadConfig, settingName: string) {
    const key = getCurrentlyAssignedToSettingName(config, settingName);
    return config.icons[key];
}
