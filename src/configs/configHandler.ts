export function getKeyWithKeycode(config, keycode) {
    return Object.keys(config.gamepadMapping).find(key => config.gamepadMapping[key] === keycode);
}

export function getSettingNameWithKeycode(config, keycode) {
    const key = getKeyWithKeycode(config, keycode);
    return config.custom[key];
}

export function getIconWithKeycode(config, keycode) {
    const key = getKeyWithKeycode(config, keycode);
    return config.icons[key];
}

export function getButtonWithKeycode(config, keycode) {
    const settingName = getSettingNameWithKeycode(config, keycode);
    return config.settings[settingName];
}

export function getKeycodeWithKey(config, key) {
    return config.gamepadMapping[key]
}

export function getKeyWithSettingName(config, settingName) {
    return Object.keys(config.custom).find(key => config.custom[key] === settingName);
}

export function getSettingNameWithKey(config, key) {
    return config.custom[key]
}

export function getIconWithKey(config, key) {
    return config.icons[key]
}

export function getIconSpecialCase(config, keycode, settingName) {
    const potentialKey = isAlreadyBinded(config, keycode, settingName);
    if (potentialKey) return getIconWithKey(config, potentialKey);
    return null;
}

export function getButtonWithSettingName(config, settingName) {
    return config.settings[settingName];
}

export function getButtonWithKey(config, key) {
    const settingName = config.custom[key];
    return getButtonWithSettingName(config, settingName);
}

export function getIconWithSettingName(config, settingName) {
    const key = getKeyWithSettingName(config, settingName);
    return getIconWithKey(config, key);
}

export function getKeycodeWithSettingName(config, settingName) {
    const key = getKeyWithSettingName(config, settingName);
    return getKeycodeWithKey(config, key);
}

export function getSettingNameWithButton(config, button, alt= false) {
    return Object.keys(config.settings).find(k => {
        const a = !alt && !k.includes("ALT_");
        const b = alt && k.includes("ALT_");
        const c = config.settings[k] === button;
        return (a || b) && c;
    });
}

export function getKeyWithButton(config, button, alt= false) {
    const settingName = getSettingNameWithButton(config, button, alt);
    return getKeyWithSettingName(config, settingName);
}

export function getKeycodeWithButton(config, button, alt= false) {
    const key = getKeyWithButton(config, button, alt);
    return getKeycodeWithKey(config, key);
}

export function getIconWithButton(config, button, alt= false) {
    const key = getKeyWithButton(config, button, alt);
    return getIconWithKey(config, key);
}

export function isAlreadyBinded(config, keycode, settingNameTarget) {
    const key = getKeyWithKeycode(config, keycode);
    const isMain = config.main.includes(key);

    const isTargetMain = !settingNameTarget.includes("ALT_");
    const potentialExistingButton = getButtonWithSettingName(config, settingNameTarget);
    const potentialExistingKey = getKeyWithButton(config, potentialExistingButton, !isMain);

    if (potentialExistingKey && isMain !== isTargetMain) return potentialExistingKey;
    return null;
}

export function swap(config, settingNameTarget, keycode) {
    // 2 alt can't do the same thing
    // 2 main can't do the same thing
    // can't swap an alt if another alt is already doing the same
    // can't swap a main if another main is already doing the same
    const isDeleted = !getKeyWithSettingName(config, settingNameTarget);
    if (isDeleted) {
        const new_key = getKeyWithKeycode(config, keycode);
        config.custom[new_key] = settingNameTarget;
        return;
    }
    const potentialExistingKey = isAlreadyBinded(config, keycode, settingNameTarget);

    const prev_key = potentialExistingKey || getKeyWithSettingName(config, settingNameTarget);
    const prev_settingName = getSettingNameWithKey(config, prev_key);

    const new_key = getKeyWithKeycode(config, keycode);
    const new_settingName = getSettingNameWithKey(config, new_key);

    config.custom[prev_key] = new_settingName;
    config.custom[new_key] = prev_settingName;
    regenerateIdentifiers(config);
}

export function deleteBind(config, settingName) {
    const key = getKeyWithSettingName(config, settingName);
    config.custom[key] = -1;
    regenerateIdentifiers(config);
}

export function regenerateIdentifiers(config) {
    config.main = Object.keys(config.custom).filter(key => {
        const value = config.custom[key]
        return value !== -1 && !value.includes("ALT_");
    });
    config.alt = Object.keys(config.custom).filter(key => {
        const value = config.custom[key]
        return value !== -1 && value.includes("ALT_");
    });
}