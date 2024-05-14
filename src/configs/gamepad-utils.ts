import {InterfaceConfig} from "../inputs-controller";
import {Button} from "#app/enums/buttons";
import {deepCopy} from "#app/utils";

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
    return config.currentKeys[settingName];
}

export function getKeyAndActionFromCurrentKeysWithPressedButton(config, pressedButton) {
    const key = getKeyFromMapping(config, pressedButton);
    const settingName = Object.keys(config.currentKeys).find(_s => config.currentKeys[_s].key === key);
    return getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
}

export function assignNewKey(config: InterfaceConfig, settingName, pressedButton, previousBind): void {
    const key = getKeyFromMapping(config, pressedButton);
    const icon = config.ogIcons[key];
    config.icons[previousBind.key] = icon;
    config.currentKeys[settingName].icon = icon;
    config.custom[key] = previousBind.action;
}

export function swapCurrentKeys(config: InterfaceConfig, settingName, pressedButton): void {
    const previousBind = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
    const prevKey = deepCopy(previousBind);
    const newBind = getKeyAndActionFromCurrentKeysWithPressedButton(config, pressedButton);
    if (!newBind) {
        assignNewKey(config, settingName, pressedButton, previousBind);
    } else {
        const nextKey = deepCopy(newBind);
        if (prevKey.key === nextKey.key) {
            // special case when back to back and not enough info to get back to previous button
            const toRestore = getKeyAndSettingNameFromCurrentKeysWithAction(config, prevKey.from.action);
            config.custom[prevKey.key] = prevKey.from.action;
            config.icons[prevKey.key] = prevKey.from.icon;

            config.custom[toRestore.key] = prevKey.action;
            config.icons[toRestore.key] = prevKey.icon;

            delete config.currentKeys[settingName].from;
            delete config.currentKeys[toRestore.settingName].from;
        } else {
            config.custom[previousBind.key] = newBind.action;
            config.custom[newBind.key] = previousBind.action;
            config.icons[previousBind.key] = newBind.icon;
            config.icons[newBind.key] = previousBind.icon;
            const nextSettingName = getKeyAndSettingNameFromCurrentKeysWithAction(config, newBind.action).settingName;
            config.currentKeys[settingName].from = prevKey;
            config.currentKeys[nextSettingName].from = nextKey;
        }
    }
    reloadCurrentKeys(config);
}


export function reloadCurrentKeys(config): void {
    // need to rework this to include keys that were not there at the begining
    const currentKeys = config.currentKeys ? deepCopy(config.currentKeys) : {};
    for (const key of Object.keys(config.setting)) {
        const settingName = config.setting[key];
        const action = config.custom[key];
        const icon = config.icons[key];
        if (!currentKeys[settingName]) currentKeys[settingName] = {};
        currentKeys[settingName].key = key;
        currentKeys[settingName].action = action === undefined ? currentKeys[settingName].action : action;
        currentKeys[settingName].icon = icon;
    }
    config.currentKeys = deepCopy(currentKeys);
}

export function regenerateCustom(config): void {
    const custom = deepCopy(config.custom);
    for (const settingName of Object.keys(config.currentKeys)) {
        const {key, action} = config.currentKeys[settingName];
        custom[key] = action;
    }
    config.custom = deepCopy(custom);
}

export function deleteBind(config, settingName): void {
    const { key } = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
    delete config.currentKeys[settingName].icon
    config.custom[key] = undefined
}