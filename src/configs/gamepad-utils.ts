import {GamepadConfig} from "../inputs-controller";
import {SettingGamepad} from "#app/system/settings-gamepad";
import {Button} from "#app/enums/buttons";


export function getKeyForButtonIndex(config: GamepadConfig, index: number): String {
    for (const key of Object.keys(config.gamepadMapping)) {
        const id = config.gamepadMapping[key];
        if (id === index) return key;
    }
    return null;
}
export function getButtonIndexForKey(config: GamepadConfig, _key: string): number {
    for (const key of Object.keys(config.gamepadMapping)) {
        if (key === _key) return config.gamepadMapping[key];
    }
    return null;
}

export function getIconForCustomIndex(config: GamepadConfig, index: number): String {
    const key = getKeyForButtonIndex(config, index);
    return config.icons[key];
}

export function getKeyForRebindedAction(config: GamepadConfig, action: Button): String {
    for (const key of Object.keys(config.default)) {
        if (config.default[key] === action) return key;
    }
    return null;
}

export function getKeyForAction(config: GamepadConfig, action: Button): String {
    for (const key of Object.keys(config.custom)) {
        if (config.custom[key] === action) return key;
    }
    return null;
}

export function getKeyForRebindedSettingName(config: GamepadConfig, settingName: SettingGamepad): String {
    const oldKey = getKeyForSettingName(config, settingName)
    const action = config.custom[oldKey];
    const key = getKeyForRebindedAction(config, action);
    return key;
}

export function getIconForRebindedKey(config: GamepadConfig, _key): String {
    const action = config.custom[_key];
    const key = getKeyForRebindedAction(config, action);
    return config.icons[key];
}

export function getKeyForSettingName(config: GamepadConfig, settingName: SettingGamepad) {
    for (const key of Object.keys(config.setting)) {
        const name = config.setting[key];
        if (name === settingName) return key;
    }
    return null;
}

export function getIconForSettingName(config: GamepadConfig, settingName: SettingGamepad) {
    const key = getKeyForSettingName(config, settingName);
    const action = config.default[key];
    const rebindedKey = getKeyForAction(config, action);
    return config.icons[rebindedKey];
}
