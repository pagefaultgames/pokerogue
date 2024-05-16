import {Device} from "#app/enums/devices";

/**
 * Retrieves the key associated with the specified keycode from the mapping.
 *
 * @param config - The configuration object containing the mapping.
 * @param keycode - The keycode to search for.
 * @returns The key associated with the specified keycode.
 */
export function getKeyWithKeycode(config, keycode) {
    return Object.keys(config.deviceMapping).find(key => config.deviceMapping[key] === keycode);
}

/**
 * Retrieves the setting name associated with the specified keycode.
 *
 * @param config - The configuration object containing custom settings.
 * @param keycode - The keycode to search for.
 * @returns The setting name associated with the specified keycode.
 */
export function getSettingNameWithKeycode(config, keycode) {
    const key = getKeyWithKeycode(config, keycode);
    return config.custom[key];
}

/**
 * Retrieves the icon associated with the specified keycode.
 *
 * @param config - The configuration object containing icons.
 * @param keycode - The keycode to search for.
 * @returns The icon associated with the specified keycode.
 */
export function getIconWithKeycode(config, keycode) {
    const key = getKeyWithKeycode(config, keycode);
    return config.icons[key];
}

/**
 * Retrieves the button associated with the specified keycode.
 *
 * @param config - The configuration object containing settings.
 * @param keycode - The keycode to search for.
 * @returns The button associated with the specified keycode.
 */
export function getButtonWithKeycode(config, keycode) {
    const settingName = getSettingNameWithKeycode(config, keycode);
    return config.settings[settingName];
}

/**
 * Retrieves the key associated with the specified setting name.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingName - The setting name to search for.
 * @returns The key associated with the specified setting name.
 */
export function getKeyWithSettingName(config, settingName) {
    return Object.keys(config.custom).find(key => config.custom[key] === settingName);
}

/**
 * Retrieves the setting name associated with the specified key.
 *
 * @param config - The configuration object containing custom settings.
 * @param key - The key to search for.
 * @returns The setting name associated with the specified key.
 */
export function getSettingNameWithKey(config, key) {
    return config.custom[key];
}

/**
 * Retrieves the icon associated with the specified key.
 *
 * @param config - The configuration object containing icons.
 * @param key - The key to search for.
 * @returns The icon associated with the specified key.
 */
export function getIconWithKey(config, key) {
    return config.icons[key];
}

/**
 * Retrieves the icon for a special case where a key is bound to a different type of binding.
 * This special case occurs when attempting to bind a key from either a main or alternate binding
 * to a different type of binding, resulting in two main or two alternate bindings having the same action.
 * In such cases, the two bindings are swapped to maintain uniqueness.
 *
 * @param config - The configuration object containing icons.
 * @param keycode - The keycode to search for.
 * @param settingName - The setting name to search for.
 * @returns The icon associated with the special case or null if not found.
 */
export function getIconSpecialCase(config, keycode, settingName) {
    const potentialKey = getKeySolvingConflict(config, keycode, settingName);
    if (potentialKey) return getIconWithKey(config, potentialKey);
    return null;
}

/**
 * Retrieves the button associated with the specified setting name.
 *
 * @param config - The configuration object containing settings.
 * @param settingName - The setting name to search for.
 * @returns The button associated with the specified setting name.
 */
export function getButtonWithSettingName(config, settingName) {
    return config.settings[settingName];
}

/**
 * Retrieves the icon associated with the specified setting name.
 *
 * @param config - The configuration object containing icons.
 * @param settingName - The setting name to search for.
 * @returns The icon associated with the specified setting name.
 */
export function getIconWithSettingName(config, settingName) {
    const key = getKeyWithSettingName(config, settingName);
    return getIconWithKey(config, key);
}

export function getIconForLatestInput(configs, source, devices, settingName) {
    let config;
    if (source === 'gamepad') config = configs[devices[Device.GAMEPAD]];
    else config = configs[devices[Device.KEYBOARD]];
    return getIconWithSettingName(config, settingName);
}

/**
 * Retrieves the setting name associated with the specified button.
 *
 * @param config - The configuration object containing settings.
 * @param button - The button to search for.
 * @param alt - A flag indicating if the search is for an alternate setting.
 * @returns The setting name associated with the specified button.
 */
export function getSettingNameWithButton(config, button, alt = false) {
    return Object.keys(config.settings).find(k => {
        const a = !alt && !k.includes("ALT_");
        const b = alt && k.includes("ALT_");
        const c = config.settings[k] === button;
        return (a || b) && c;
    });
}

/**
 * Retrieves the key associated with the specified button.
 *
 * @param config - The configuration object containing custom settings.
 * @param button - The button to search for.
 * @param alt - A flag indicating if the search is for an alternate setting.
 * @returns The key associated with the specified button.
 */
export function getKeyWithButton(config, button, alt = false) {
    const settingName = getSettingNameWithButton(config, button, alt);
    return getKeyWithSettingName(config, settingName);
}

/**
 * Identifies a key that resolves a binding conflict when attempting to bind a keycode to a specified setting name target.
 * This function checks if the keycode is already bound to a different type of binding (main or alternate) and returns
 * the conflicting key if found.
 *
 * @param config - The configuration object containing custom settings.
 * @param keycode - The keycode to check.
 * @param settingNameTarget - The setting name target to bind.
 * @returns The conflicting key if found, or null if no conflict is found.
 */
export function getKeySolvingConflict(config, keycode, settingNameTarget) {
    const key = getKeyWithKeycode(config, keycode);
    const isMain = config.main.includes(key);

    const isTargetMain = !settingNameTarget.includes("ALT_");
    const potentialExistingButton = getButtonWithSettingName(config, settingNameTarget);
    const potentialExistingKey = getKeyWithButton(config, potentialExistingButton, !isMain);

    if (potentialExistingKey && isMain !== isTargetMain) return potentialExistingKey;
    return null;
}

/**
 * Swaps the binding of a keycode with the specified setting name target.
 * If the target setting is deleted, it directly binds the keycode to the target setting.
 * Otherwise, it handles any potential conflicts by swapping the bindings.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingNameTarget - The setting name target to swap.
 * @param keycode - The keycode to swap.
 */
export function swap(config, settingNameTarget, keycode) {
    // Check if the setting name target is already deleted (i.e., not bound to any key).
    const isDeleted = !getKeyWithSettingName(config, settingNameTarget);
    // If the setting name target is deleted, bind the new key to the setting name target and return.
    if (isDeleted) {
        const new_key = getKeyWithKeycode(config, keycode);
        config.custom[new_key] = settingNameTarget;
        return;
    }
    // Check for any potential conflict with existing bindings.
    const potentialExistingKey = getKeySolvingConflict(config, keycode, settingNameTarget);

    const prev_key = potentialExistingKey || getKeyWithSettingName(config, settingNameTarget);
    const prev_settingName = getSettingNameWithKey(config, prev_key);

    const new_key = getKeyWithKeycode(config, keycode);
    const new_settingName = getSettingNameWithKey(config, new_key);

    config.custom[prev_key] = new_settingName;
    config.custom[new_key] = prev_settingName;
    regenerateIdentifiers(config);
}

/**
 * Deletes the binding of the specified setting name.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingName - The setting name to delete.
 */
export function deleteBind(config, settingName) {
    const key = getKeyWithSettingName(config, settingName);
    config.custom[key] = -1;
    regenerateIdentifiers(config);
}

/**
 * Regenerates the identifiers for main and alternate settings.
 * This allows distinguishing between main and alternate bindings.
 *
 * @param config - The configuration object containing custom settings.
 */
export function regenerateIdentifiers(config) {
    config.main = Object.keys(config.custom).filter(key => {
        const value = config.custom[key];
        return value !== -1 && !value.includes("ALT_");
    });

    config.alt = Object.keys(config.custom).filter(key => {
        const value = config.custom[key];
        return value !== -1 && value.includes("ALT_");
    });
}
