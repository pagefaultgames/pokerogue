import {InterfaceConfig} from "../inputs-controller";
import {Button} from "#app/enums/buttons";

// Given a button index from an input event, return its naming from the mapping config
export function getKeyFromMapping(config: InterfaceConfig, index: number): String | null {
    for (const key of Object.keys(config.gamepadMapping)) {
        if (config.gamepadMapping[key] === index) return key;
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

// Given a setting name, return the key assigned to it from the config file
export function getIconForSettingName(config: InterfaceConfig, settingName: string): String | null {
    const key = getKeyForSettingName(config, settingName);
    return config.icons[key];
}

// Given a Button, return the custom key assigned to it from the config file
export function getKeyWithAction(config: InterfaceConfig, action: Button, alt: boolean = false): String | null {
    // need to find a way to differentiate main/alt button
    const { key } = getKeyAndSettingNameFromCurrentKeysWithAction(config, action, alt);
    return key;
}

// Given a button index from an input event, return its icon from the config file
export function getIconWithPressedButton(config: InterfaceConfig, pressedButton: number): String {
    const key = getKeyFromMapping(config, pressedButton);
    return config.icons[key];
}

// Given a setting name, return the icon currently assigned to this setting name
export function getIconWithSettingName(config: InterfaceConfig, settingName: string): string {
    const { icon } = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName)
    return icon;
}

function getKeyAndSettingNameFromCurrentKeysWithAction(config, _action, alt: boolean = false) {
    for (const _settingName of Object.keys(config.currentKeys)) {
        if (alt && !_settingName.includes("ALT_")) continue;
        if (config.currentKeys[_settingName].action === _action) return {
            settingName: _settingName,
            key: config.currentKeys[_settingName].key,
        };
    }
    return null;
}

export function getKeyAndActionFromCurrentKeysWithSettingName(config, settingName) {
    for (const _settingName of Object.keys(config.currentKeys)) {
        if (_settingName === settingName) return config.currentKeys[_settingName];
    }
    return null;
}

export function getKeyAndActionFromCurrentKeysWithPressedButton(config, pressedButton) {
    const key = getKeyFromMapping(config, pressedButton);
    const settingName = Object.keys(config.currentKeys).find(_s => config.currentKeys[_s].key === key);
    return getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
}

export function swapCurrentKeys(config: InterfaceConfig, settingName, pressedButton): void {
    const previousBind = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
    const newBind = getKeyAndActionFromCurrentKeysWithPressedButton(config, pressedButton);
    config.custom[previousBind.key] = newBind.action;
    config.custom[newBind.key] = previousBind.action;
    config.icons[previousBind.key] = newBind.icon;
    config.icons[newBind.key] = previousBind.icon;
    reloadCurrentKeys(config);
}


export function reloadCurrentKeys(config): void {
    // need to rework this to include keys that were not there at the begining
    const currentKeys = {};
    debugger;
    for (const key of Object.keys(config.setting)) {
        const settingName = config.setting[key];
        const action = config.custom[key];
        const icon = config.icons[key];
        currentKeys[settingName] = {
            key,
            action,
            icon,
        }
    }
    config.currentKeys = currentKeys;
}