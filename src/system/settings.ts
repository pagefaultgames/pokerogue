import BattleScene from "../battle-scene";
import { updateWindowType } from "../ui/window";

export enum Setting {
  Game_Speed = "GAME_SPEED",
  Master_Volume = "MASTER_VOLUME",
  BGM_Volume = "BGM_VOLUME",
  SE_Volume = "SE_VOLUME",
  Show_Stats_on_Level_Up = "SHOW_LEVEL_UP_STATS",
  Window_Type = "WINDOW_TYPE",
  Touch_Controls = "TOUCH_CONTROLS"
}

export interface SettingOptions {
  [key: string]: string[]
}

export interface SettingDefaults {
  [key: string]: integer
}

export const settingOptions: SettingOptions = {
  [Setting.Game_Speed]: [ '1x', '1.25x', '1.5x', '2x', '2.5x', '3x', '4x', '5x' ],
  [Setting.Master_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : 'Mute'),
  [Setting.BGM_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : 'Mute'),
  [Setting.SE_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : 'Mute'),
  [Setting.Show_Stats_on_Level_Up]: [ 'Off', 'On' ],
  [Setting.Window_Type]: new Array(4).fill(null).map((_, i) => (i + 1).toString()),
  [Setting.Touch_Controls]: [ 'Auto', 'Disabled' ]
};

export const settingDefaults: SettingDefaults = {
  [Setting.Game_Speed]: 0,
  [Setting.Master_Volume]: 5,
  [Setting.BGM_Volume]: 10,
  [Setting.SE_Volume]: 10,
  [Setting.Show_Stats_on_Level_Up]: 1,
  [Setting.Window_Type]: 0,
  [Setting.Touch_Controls]: 0
};

export function setSetting(scene: BattleScene, setting: Setting, value: integer): boolean {
  switch (setting) {
    case Setting.Game_Speed:
      scene.gameSpeed = parseFloat(settingOptions[setting][value].replace('x', ''));
      break;
    case Setting.Master_Volume:
      scene.masterVolume = value ? parseInt(settingOptions[setting][value]) * 0.01 : 0;
      scene.updateSoundVolume();
      break;
    case Setting.BGM_Volume:
      scene.bgmVolume = value ? parseInt(settingOptions[setting][value]) * 0.01 : 0;
      scene.updateSoundVolume();
      break;
    case Setting.SE_Volume:
      scene.seVolume = value ? parseInt(settingOptions[setting][value]) * 0.01 : 0;
      scene.updateSoundVolume();
      break;
    case Setting.Show_Stats_on_Level_Up:
      scene.showLevelUpStats = settingOptions[setting][value] === 'On';
      break;
    case Setting.Window_Type:
      updateWindowType(scene, parseInt(settingOptions[setting][value]));
      break;
    case Setting.Touch_Controls:
      const touchControls = document.getElementById('touchControls');
      if (touchControls)
        touchControls.classList.toggle('visible', settingOptions[setting][value] !== 'Disabled' && hasTouchscreen());
      break;
  }

  return true;
}