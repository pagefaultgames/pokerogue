import {InterfaceConfig} from "../inputs-controller";
import {Button} from "#app/enums/buttons";


// Given a button index from an input event, return its naming from the mapping config
export function getKeyFromInputIndex(config: InterfaceConfig, index: number): String | null {
    for (const key of Object.keys(config.gamepadMapping)) {
        if (config.gamepadMapping[key] === index) return key;
    }
    return null;
}
export function getKeyFromKeyboardKeyCode(config: InterfaceConfig, key): String | null {
    for (const _key of Object.keys(config.gamepadMapping)) {
        if (config.gamepadMapping[_key] === key) return _key;
    }
    return null;
}

// Given a setting name, return the key assigned to it from the config file
export function getKeyForSettingName(config: InterfaceConfig, settingName: string): String | null {
    for (const key of Object.keys(config.setting)) {
        if (config.setting[key] === settingName) return key;
    }
    return null;
}

// Given a Button, return the custom key assigned to it from the config file
export function getCurrenlyAssignedKeyToAction(config: InterfaceConfig, action: Button, alt: boolean = false): String | null {
    // need to find a way to differentiate main/alt button
    for (const key of Object.keys(config.custom)) {
        if (config.custom[key] === action) return key;
    }
    return null;
}

// Given a setting name, return the custom key for the default action from the config file
export function getCurrentlyAssignedToSettingName(config: InterfaceConfig, settingName: string): String {
    const oldKey = getKeyForSettingName(config, settingName)
    const action = config.default[oldKey];
    const key = getCurrenlyAssignedKeyToAction(config, action, settingName.includes("ALT_BUTTON_"));
    return key;
}

// Given a button index from an input event, return its icon from the config file
export function getCurrenlyAssignedIconFromInputIndex(config: InterfaceConfig, index: number): String {
    const key = getKeyFromInputIndex(config, index);
    return config.icons[key];
}

export function getCurrenlyAssignedIconFromKeyboardKeyCode(config: InterfaceConfig, key): String {
    const _key = getKeyFromKeyboardKeyCode(config, key);
    return config.icons[_key];
}

// Given a setting name, return the icon currently assigned to this setting name
export function getCurrentlyAssignedIconToSettingName(config: InterfaceConfig, settingName: string): string {
    const key = getCurrentlyAssignedToSettingName(config, settingName);
    return config.icons[key];
}
