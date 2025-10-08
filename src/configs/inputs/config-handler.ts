import type { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import type { SettingGamepad } from "#system/settings-gamepad";
import type { SettingKeyboard } from "#system/settings-keyboard";
import type {
  CustomInterfaceConfig,
  GamepadButtonName,
  InterfaceButtonName,
  InterfaceConfig,
  KeyboardConfig,
  KeyboardKeyName,
  MappingSettingName,
  PadConfig,
  SelectedDevice,
} from "#types/configs/inputs";

/**
 * Retrieve the key associated with the specified keycode from the mapping.
 *
 * @param config - The configuration object containing the mapping.
 * @param keycode - The keycode to search for.
 * @returns The key associated with the specified keycode, or undefined if not found.
 */
export function getKeyWithKeycode(config: KeyboardConfig, keycode: number | undefined): KeyboardKeyName | undefined;
export function getKeyWithKeycode(config: PadConfig, keycode: number | undefined): GamepadButtonName | undefined;
export function getKeyWithKeycode(
  config: InterfaceConfig,
  keycode: number | undefined,
): InterfaceButtonName | undefined;
export function getKeyWithKeycode(
  config: InterfaceConfig,
  keycode: number | undefined,
): InterfaceButtonName | undefined {
  for (const [key, value] of Object.entries(config.deviceMapping)) {
    if (value === keycode) {
      return key as InterfaceButtonName;
    }
  }
}

/**
 * Retrieve the setting name associated with the specified keycode.
 *
 * @param config - The configuration object containing custom settings.
 * @param keycode - The keycode to search for.
 * @returns The setting name associated with the specified keycode.
 */
export function getSettingNameWithKeycode(
  config: KeyboardConfig,
  keycode: number | undefined,
): SettingKeyboard | undefined;
export function getSettingNameWithKeycode(config: PadConfig, keycode: number | undefined): SettingGamepad | undefined;
export function getSettingNameWithKeycode(
  config: InterfaceConfig,
  keycode: number | undefined,
): MappingSettingName | undefined;
export function getSettingNameWithKeycode(config: InterfaceConfig, keycode: number | undefined): string | undefined {
  const key = getKeyWithKeycode(config, keycode);
  // Bang is fine here; if undefined is used to index, then result will just be undefined
  return config.custom?.[key! as keyof typeof config.custom];
}

/**
 * Retrieves the icon associated with the specified keycode.
 *
 * @param config - The configuration object containing icons.
 * @param keycode - The keycode to search for.
 * @returns The icon associated with the specified keycode.
 */
export function getIconWithKeycode(config: InterfaceConfig, keycode: number): string | undefined {
  const key = getKeyWithKeycode(config, keycode);
  // Bang is fine here; if undefined is used to index, then result will just be undefined
  return config.icons[key! as keyof typeof config.icons];
}

/**
 * Retrieves the button associated with the specified keycode.
 *
 * @param config - The configuration object containing settings.
 * @param keycode - The keycode to search for.
 * @returns The button associated with the specified keycode.
 */
export function getButtonWithKeycode(config: InterfaceConfig, keycode: number): Button | undefined {
  const settingName = getSettingNameWithKeycode(config, keycode);
  return config.settings[settingName! as keyof typeof config.settings];
}

/**
 * Retrieves the key associated with the specified setting name.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingName - The setting name to search for.
 * @returns The key associated with the specified setting name.
 */
export function getKeyWithSettingName(
  config: KeyboardConfig,
  settingName: SettingKeyboard | undefined,
): KeyboardKeyName | undefined;
export function getKeyWithSettingName(config: PadConfig, settingName: SettingGamepad): GamepadButtonName | undefined;
export function getKeyWithSettingName(
  config: InterfaceConfig,
  settingName: MappingSettingName | undefined,
): InterfaceButtonName | undefined;
export function getKeyWithSettingName(
  config: InterfaceConfig,
  settingName: MappingSettingName | undefined,
): InterfaceButtonName | undefined {
  for (const [key, value] of Object.entries(config.custom!)) {
    if (value === settingName) {
      return key as InterfaceButtonName;
    }
  }
}

/**
 * Retrieves the setting name associated with the specified key.
 *
 * @param config - The configuration object containing custom settings.
 * @param key - The key to search for.
 * @returns The setting name associated with the specified key, or `-1` if not found or unset
 */
export function getSettingNameWithKey(config: KeyboardConfig, key: KeyboardKeyName | undefined): SettingKeyboard | -1;
export function getSettingNameWithKey(config: PadConfig, key: GamepadButtonName | undefined): GamepadButtonName | -1;
export function getSettingNameWithKey(
  config: InterfaceConfig,
  key: InterfaceButtonName | undefined,
): MappingSettingName | -1;
export function getSettingNameWithKey(config: InterfaceConfig, key: string | undefined): string | -1 {
  // Cast is OK here; if key is invalid, result will just be undefined
  return config.custom?.[key as keyof typeof config.custom] ?? -1;
}

/**
 * Retrieves the icon associated with the specified key.
 *
 * @param config - The configuration object containing icons.
 * @param key - The key to search for.
 * @returns The icon associated with the specified key.
 */
export function getIconWithKey(config: InterfaceConfig, key: InterfaceButtonName | undefined): string | undefined {
  return config.icons[key as keyof typeof config.icons];
}

/**
 * Retrieves the icon associated with the specified setting name.
 *
 * @param config - The configuration object containing icons.
 * @param settingName - The setting name to search for.
 * @returns The icon associated with the specified setting name.
 */
export function getIconWithSettingName(
  config: InterfaceConfig,
  settingName: MappingSettingName | undefined,
): string | undefined {
  const key = getKeyWithSettingName(config, settingName);
  // Bang is fine here; if undefined is used to index, then result will just be undefined
  return getIconWithKey(config, key!);
}

/**
 * Retrieves the icon for the latest input based on the source and setting name.
 *
 * @param configs - A map of device IDs to InterfaceConfig objects.
 * @param source - The input source ("gamepad" or other).
 * @param devices - A map of Device enums to device IDs.
 * @param settingName - The setting name to retrieve the icon for.
 * @returns The icon string if found, otherwise tries the alternate setting name.
 */
export function getIconForLatestInput(
  configs: Record<string, InterfaceConfig>,
  source: string,
  devices: SelectedDevice,
  settingName: MappingSettingName,
): string | undefined {
  let config: InterfaceConfig;
  if (source === "gamepad") {
    config = configs[devices[Device.GAMEPAD]!];
  } else {
    config = configs[devices[Device.KEYBOARD]];
  }
  const icon = getIconWithSettingName(config, settingName);
  if (!icon) {
    const isAlt = settingName.includes("ALT_");
    let altSettingName: string;
    if (isAlt) {
      altSettingName = settingName.split("ALT_").splice(1)[0];
    } else {
      altSettingName = `ALT_${settingName}`;
    }
    return getIconWithSettingName(config, altSettingName as MappingSettingName);
  }
  return icon;
}

export function assign(config: CustomInterfaceConfig, settingNameTarget: MappingSettingName, keycode: number): boolean {
  // first, we need to check if this keycode is already used on another settingName
  if (
    !canIAssignThisKey(config, getKeyWithKeycode(config, keycode))
    || !canIOverrideThisSetting(config, settingNameTarget)
  ) {
    return false;
  }
  const previousSettingName = getSettingNameWithKeycode(config, keycode);
  // if it was already bound, we delete the bind
  if (previousSettingName) {
    const previousKey = getKeyWithSettingName(config, previousSettingName);
    if (previousKey && config.custom) {
      // @ts-expect-error: TypeScript can't handle union of config types
      config.custom[previousKey] = -1;
    }
  }
  // then, we need to delete the current key for this settingName
  const currentKey = getKeyWithSettingName(config, settingNameTarget);
  if (currentKey) {
    // @ts-expect-error: TypeScript can't handle union of config types
    config.custom[currentKey] = -1;
  }

  // then, the new key is assigned to the new settingName
  const newKey = getKeyWithKeycode(config, keycode);
  if (newKey) {
    // @ts-expect-error: TypeScript can't handle union of config types
    config.custom[newKey] = settingNameTarget;
  }
  return true;
}

export function swap(config: CustomInterfaceConfig, settingNameTarget: MappingSettingName, keycode: number) {
  // only for gamepad
  if (config.padType === "keyboard" || config.custom == null) {
    return false;
  }
  const prev_key = getKeyWithSettingName(config, settingNameTarget);
  const prev_settingName = getSettingNameWithKey(config, prev_key!);

  const new_key = getKeyWithKeycode(config, keycode);
  const new_settingName = getSettingNameWithKey(config, new_key!);

  if (prev_key) {
    // @ts-expect-error: Typescript doesn't know that prev_key must match a key of config.custom
    config.custom[prev_key] = new_settingName;
  }
  if (new_key) {
    // @ts-expect-error: Typescript doesn't know that prev_key must match a key of config.custom
    config.custom[new_key] = prev_settingName;
  }
  return true;
}

/**
 * Deletes the binding of the specified setting name.
 *
 * @param config - The configuration object containing custom settings.
 * @param settingName - The setting name to delete.
 */
export function deleteBind(config: CustomInterfaceConfig, settingName: MappingSettingName | undefined): boolean {
  const key = getKeyWithSettingName(config, settingName);
  // bang is fine here since if key is undefined, it would just return fals6e
  if (config.blacklist?.includes(key!)) {
    return false;
  }
  if (key != null) {
    // @ts-expect-error: Typescript thinks config.custom[key] is typeof never
    config.custom[key as keyof typeof config.custom] = -1;
  }
  return true;
}

export function canIAssignThisKey(config: CustomInterfaceConfig, key: InterfaceButtonName | undefined) {
  const settingName = getSettingNameWithKey(config, key);
  // bang is fine here since if key is undefined, it would just return false
  if (config.blacklist?.includes(key!)) {
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

export function canIOverrideThisSetting(config: CustomInterfaceConfig, settingName: MappingSettingName | undefined) {
  const key = getKeyWithSettingName(config, settingName);
  // || isTheLatestBind(config, settingName) no longer needed since action and cancel are protected
  return !config.blacklist?.includes(key!);
}

export function canIDeleteThisKey(config: CustomInterfaceConfig, key: InterfaceButtonName | undefined) {
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
