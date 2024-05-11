import {GamepadConfig} from "../inputs-controller";
import {SettingGamepad} from "#app/system/settings-gamepad";


export function getKeyForButtonIndex(config: GamepadConfig, index: integer): String {
    for (const key of Object.keys(config.gamepadMapping)) {
        const id = config.gamepadMapping[key];
        if (id === index) return key;
    }
    return null;
}

export function getIconForCustomIndex(config: GamepadConfig, index: integer): String {
    const key = getKeyForButtonIndex(config, index);
    return config.icons[key];
}

export function getKeyForSettingName(config: GamepadConfig, settingName: SettingGamepad) {
    for (const key of Object.keys(config.setting)) {
        const name = config.setting[key];
        if (name === settingName) return key;
    }
    return null;
}