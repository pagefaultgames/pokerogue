import BattleScene from "../battle-scene";
import {SettingDefaults, SettingOptions} from "#app/system/settings";

export enum SettingGamepad {
  Gamepad_Support = "GAMEPAD_SUPPORT",
  Swap_A_and_B = "SWAP_A_B", // Swaps which gamepad button handles ACTION and CANCEL
}

export const settingGamepadOptions: SettingOptions = {
  [SettingGamepad.Gamepad_Support]: [ 'Auto', 'Disabled' ],
  [SettingGamepad.Swap_A_and_B]: [ 'Enabled', 'Disabled' ],
};

export const settingGamepadDefaults: SettingDefaults = {
  [SettingGamepad.Gamepad_Support]: 0,
  [SettingGamepad.Swap_A_and_B]: 1, // Set to 'Disabled' by default
};

export function setSettingGamepad(scene: BattleScene, setting: SettingGamepad, value: integer): boolean {
  switch (setting) {
    case SettingGamepad.Gamepad_Support:
      scene.gamepadSupport = settingGamepadOptions[setting][value] !== 'Disabled';
      break;
    case SettingGamepad.Swap_A_and_B:
      scene.abSwapped = settingGamepadOptions[setting][value] !== 'Disabled';
      break;
  }

  return true;
}
