import BattleScene from "../battle-scene";
import { hasTouchscreen } from "../touch-controls";
import { updateWindowType } from "../ui/window";
import { PlayerGender } from "./game-data";

export enum Setting {
  Game_Speed = "GAME_SPEED",
  Master_Volume = "MASTER_VOLUME",
  BGM_Volume = "BGM_VOLUME",
  SE_Volume = "SE_VOLUME",
  Damage_Numbers = "DAMAGE_NUMBERS",
  Show_Stats_on_Level_Up = "SHOW_LEVEL_UP_STATS",
  Window_Type = "WINDOW_TYPE",
  Tutorials = "TUTORIALS",
  Sprite_Set = "SPRITE_SET",
  Fusion_Palette_Swaps = "FUSION_PALETTE_SWAPS",
  Player_Gender = "PLAYER_GENDER",
  Touch_Controls = "TOUCH_CONTROLS",
  Vibration = "VIBRATION"
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
  [Setting.Damage_Numbers]: [ 'Off', 'Simple', 'Fancy' ],
  [Setting.Show_Stats_on_Level_Up]: [ 'Off', 'On' ],
  [Setting.Window_Type]: new Array(4).fill(null).map((_, i) => (i + 1).toString()),
  [Setting.Tutorials]: [ 'Off', 'On' ],
  [Setting.Sprite_Set]: [ 'Consistent', 'Prioritize Animation' ],
  [Setting.Fusion_Palette_Swaps]: [ 'Off', 'On' ],
  [Setting.Player_Gender]: [ 'Boy', 'Girl' ],
  [Setting.Touch_Controls]: [ 'Auto', 'Disabled' ],
  [Setting.Vibration]: [ 'Auto', 'Disabled' ]
};

export const settingDefaults: SettingDefaults = {
  [Setting.Game_Speed]: 3,
  [Setting.Master_Volume]: 5,
  [Setting.BGM_Volume]: 10,
  [Setting.SE_Volume]: 10,
  [Setting.Damage_Numbers]: 0,
  [Setting.Show_Stats_on_Level_Up]: 1,
  [Setting.Window_Type]: 0,
  [Setting.Tutorials]: 1,
  [Setting.Sprite_Set]: 0,
  [Setting.Fusion_Palette_Swaps]: 1,
  [Setting.Player_Gender]: 0,
  [Setting.Touch_Controls]: 0,
  [Setting.Vibration]: 0
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
    case Setting.Damage_Numbers:
      scene.damageNumbersMode = value;
      break;
    case Setting.Show_Stats_on_Level_Up:
      scene.showLevelUpStats = settingOptions[setting][value] === 'On';
      break;
    case Setting.Window_Type:
      updateWindowType(scene, parseInt(settingOptions[setting][value]));
      break;
    case Setting.Tutorials:
      scene.enableTutorials = settingOptions[setting][value] === 'On';
      break;
    case Setting.Sprite_Set:
      scene.experimentalSprites = !!value;
      if (value)
        scene.initExpSprites();
      break;
    case Setting.Fusion_Palette_Swaps:
      scene.fusionPaletteSwaps = !!value;
      break;
    case Setting.Player_Gender:
      if (scene.gameData) {
        const female = settingOptions[setting][value] === 'Girl';
        scene.gameData.gender = female ? PlayerGender.FEMALE : PlayerGender.MALE;
        scene.trainer.setTexture(scene.trainer.texture.key.replace(female ? 'm' : 'f', female ? 'f' : 'm'));
      } else
        return false;
      break;
    case Setting.Touch_Controls:
      scene.enableTouchControls = settingOptions[setting][value] !== 'Disabled' && hasTouchscreen();
      const touchControls = document.getElementById('touchControls');
      if (touchControls)
        touchControls.classList.toggle('visible', scene.enableTouchControls);
      break;
    case Setting.Vibration:
      scene.enableVibration = settingOptions[setting][value] !== 'Disabled' && hasTouchscreen();
      break;
  }

  return true;
}