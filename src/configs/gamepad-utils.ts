import {GamepadConfig} from "../inputs-controller";


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