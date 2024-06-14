import {Device} from "#enums/devices";

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
  if (source === "gamepad") {
    config = configs[devices[Device.GAMEPAD]];
  } else {
    config = configs[devices[Device.KEYBOARD]];
  }
  const icon = getIconWithSettingName(config, settingName);
  if (!icon) {
    const isAlt = settingName.includes("ALT_");
    let altSettingName;
    if (isAlt) {
      altSettingName = settingName.split("ALT_").splice(1)[0];
    } else {
      altSettingName = `ALT_${settingName}`;
    }
    return getIconWithSettingName(config, altSettingName);
  }
  return icon;
}

export function assign(config, settingNameTarget, keycode): boolean {
  // first, we need to check if this keycode is already used on another settingName
  if (!canIAssignThisKey(config, getKeyWithKeycode(config, keycode)) || !canIOverrideThisSetting(config, settingNameTarget)) {
    return false;
  }
  const previousSettingName = getSettingNameWithKeycode(config, keycode);
  // if it was already bound, we delete the bind
  if (previousSettingName) {
    const previousKey = getKeyWithSettingName(config, previousSettingName);
    config.custom[previousKey] = -1;
  }
  // then, we need to delete the current key for this settingName
  const currentKey = getKeyWithSettingName(config, settingNameTarget);
  config.custom[currentKey] = -1;

  // then, the new key is assigned to the new settingName
  const newKey = getKeyWithKeycode(config, keycode);
  config.custom[newKey] = settingNameTarget;
  return true;
}

export function swap(config, settingNameTarget, keycode) {
  // only for gamepad
  if (config.padType === "keyboard") {
    return false;
  }
  const prev_key = getKeyWithSettingName(config, settingNameTarget);
  const prev_settingName = getSettingNameWithKey(config, prev_key);

  const new_key = getKeyWithKeycode(config, keycode);
  const new_settingName = getSettingNameWithKey(config, new_key);

  config.custom[prev_key] = new_settingName;
  config.custom[new_key] = prev_settingName;
  return true;
}

/**
 * Deletes the binding of the specified setting name.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingName - The setting name to delete.
 */
export function deleteBind(config, settingName) {
  const key = getKeyWithSettingName(config, settingName);
  if (config.blacklist.includes(key)) {
    return false;
  }
  config.custom[key] = -1;
  return true;
}

export function canIAssignThisKey(config, key) {
  const settingName = getSettingNameWithKey(config, key);
  if (config.blacklist?.includes(key)) {
    return false;
  }
  if (settingName === -1) {
    return true;
  }
  // if (isTheLatestBind(config, settingName)) {
  //   return false;
  // }
  return true;
}

export function canIOverrideThisSetting(config, settingName) {
  const key = getKeyWithSettingName(config, settingName);
  // || isTheLatestBind(config, settingName) no longer needed since action and cancel are protected
  if (config.blacklist?.includes(key)) {
    return false;
  }
  return true;
}

export function canIDeleteThisKey(config, key) {
  return canIAssignThisKey(config, key);
}

// export function isTheLatestBind(config, settingName) {
//   if (config.padType !== "keyboard") {
//     return false;
//   }
//   const isAlt = settingName.includes("ALT_");
//   let altSettingName;
//   if (isAlt) {
//     altSettingName = settingName.split("ALT_").splice(1)[0];
//   } else {
//     altSettingName = `ALT_${settingName}`;
//   }
//   const secondButton = getKeyWithSettingName(config, altSettingName);
//   return secondButton === undefined;
// }
