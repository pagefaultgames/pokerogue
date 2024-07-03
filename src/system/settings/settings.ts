import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import BattleScene from "../../battle-scene";
import { hasTouchscreen } from "../../touch-controls";
import { updateWindowType } from "../../ui/ui-theme";
import { CandyUpgradeNotificationChangedEvent } from "../../events/battle-scene";
import SettingsUiHandler from "#app/ui/settings/settings-ui-handler";
import { EaseType } from "#enums/ease-type";
import { MoneyFormat } from "#enums/money-format";
import { PlayerGender } from "#enums/player-gender";

const MUTE = "Mute";
const VOLUME_OPTIONS = new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : MUTE);
const OFF_ON = ["Off", "On"];
const AUTO_DISABLED = ["Auto", "Disabled"];

/**
 * Types for helping separate settings to different menus
 */
export enum SettingType {
  GENERAL,
  DISPLAY,
  AUDIO
}

export interface Setting {
  key: string
  label: string
  options: Array<string>
  default: number
  type: SettingType
  requireReload?: boolean
}

/**
 * Setting Keys for existing settings
 * to be used when trying to find or update Settings
 */
export const SettingKeys = {
  Game_Speed: "GAME_SPEED",
  HP_Bar_Speed: "HP_BAR_SPEED",
  EXP_Gains_Speed: "EXP_GAINS_SPEED",
  EXP_Party_Display: "EXP_PARTY_DISPLAY",
  Skip_Seen_Dialogues: "SKIP_SEEN_DIALOGUES",
  Battle_Style: "BATTLE_STYLE",
  Enable_Retries: "ENABLE_RETRIES",
  Tutorials: "TUTORIALS",
  Touch_Controls: "TOUCH_CONTROLS",
  Vibration: "VIBRATION",
  Language: "LANGUAGE",
  UI_Theme: "UI_THEME",
  Window_Type: "WINDOW_TYPE",
  Money_Format: "MONEY_FORMAT",
  Damage_Numbers: "DAMAGE_NUMBERS",
  Move_Animations: "MOVE_ANIMATIONS",
  Show_Stats_on_Level_Up: "SHOW_LEVEL_UP_STATS",
  Candy_Upgrade_Notification: "CANDY_UPGRADE_NOTIFICATION",
  Candy_Upgrade_Display: "CANDY_UPGRADE_DISPLAY",
  Move_Info: "MOVE_INFO",
  Show_Moveset_Flyout: "SHOW_MOVESET_FLYOUT",
  Show_Arena_Flyout: "SHOW_ARENA_FLYOUT",
  Show_Time_Of_Day_Widget: "SHOW_TIME_OF_DAY_WIDGET",
  Time_Of_Day_Animation: "TIME_OF_DAY_ANIMATION",
  Sprite_Set: "SPRITE_SET",
  Fusion_Palette_Swaps: "FUSION_PALETTE_SWAPS",
  Player_Gender: "PLAYER_GENDER",
  Type_Hints: "TYPE_HINTS",
  Master_Volume: "MASTER_VOLUME",
  BGM_Volume: "BGM_VOLUME",
  SE_Volume: "SE_VOLUME",
  Music_Preference: "MUSIC_PREFERENCE"
};

/**
 * All Settings not related to controls
 */
export const Setting: Array<Setting> = [
  {
    key: SettingKeys.Game_Speed,
    label: "Game Speed",
    options: ["1x", "1.25x", "1.5x", "2x", "2.5x", "3x", "4x", "5x"],
    default: 3,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.HP_Bar_Speed,
    label: "HP Bar Speed",
    options: ["Normal", "Fast", "Faster", "Skip"],
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.EXP_Gains_Speed,
    label: "EXP Gains Speed",
    options: ["Normal", "Fast", "Faster", "Skip"],
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.EXP_Party_Display,
    label: "EXP Party Display",
    options: ["Normal", "Level Up Notification", "Skip"],
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Skip_Seen_Dialogues,
    label: "Skip Seen Dialogues",
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Battle_Style,
    label: "Battle Style",
    options: ["Switch", "Set"],
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Enable_Retries,
    label: "Enable Retries",
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Tutorials,
    label: "Tutorials",
    options: OFF_ON,
    default: 1,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Touch_Controls,
    label: "Touch Controls",
    options: AUTO_DISABLED,
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Vibration,
    label: "Vibration",
    options: AUTO_DISABLED,
    default: 0,
    type: SettingType.GENERAL
  },
  {
    key: SettingKeys.Language,
    label: "Language",
    options: ["English", "Change"],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true
  },
  {
    key: SettingKeys.UI_Theme,
    label: "UI Theme",
    options: ["Default", "Legacy"],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true
  },
  {
    key: SettingKeys.Window_Type,
    label: "Window Type",
    options: new Array(5).fill(null).map((_, i) => (i + 1).toString()),
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Money_Format,
    label: "Money Format",
    options: ["Normal", "Abbreviated"],
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Damage_Numbers,
    label: "Damage Numbers",
    options: ["Off", "Simple", "Fancy"],
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Move_Animations,
    label: "Move Animations",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Show_Stats_on_Level_Up,
    label: "Show Stats on Level Up",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Candy_Upgrade_Notification,
    label: "Candy Upgrade Notification",
    options: ["Off", "Passives Only", "On"],
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Candy_Upgrade_Display,
    label: "Candy Upgrade Display",
    options: ["Icon", "Animation"],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true
  },
  {
    key: SettingKeys.Move_Info,
    label: "Move Info",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Show_Moveset_Flyout,
    label: "Show Moveset Flyout",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Show_Arena_Flyout,
    label: "Show Battle Effects Flyout",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Show_Time_Of_Day_Widget,
    label: "Show Time of Day Widget",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.Time_Of_Day_Animation,
    label: "Time of Day Animation",
    options: ["Bounce", "Back"],
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Sprite_Set,
    label: "Sprite Set",
    options: ["Consistent", "Mixed Animated"],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true
  },
  {
    key: SettingKeys.Fusion_Palette_Swaps,
    label: "Fusion Palette Swaps",
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Player_Gender,
    label: "Player Gender",
    options: ["Boy", "Girl"],
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Type_Hints,
    label: "Type hints",
    options: OFF_ON,
    default: 0,
    type: SettingType.DISPLAY
  },
  {
    key: SettingKeys.Master_Volume,
    label: "Master Volume",
    options: VOLUME_OPTIONS,
    default: 5,
    type: SettingType.AUDIO
  },
  {
    key: SettingKeys.BGM_Volume,
    label: "BGM Volume",
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO
  },
  {
    key: SettingKeys.SE_Volume,
    label: "SE Volume",
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO
  },
  {
    key: SettingKeys.Music_Preference,
    label: "Music Preference",
    options: ["Consistent", "Mixed"],
    default: 0,
    type: SettingType.AUDIO,
    requireReload: true
  }
];

/**
 * Return the index of a Setting
 * @param key SettingKey
 * @returns index or -1 if doesn't exist
 */
export function settingIndex(key: string) {
  return Setting.findIndex(s => s.key === key);
}

/**
 * Resets all settings to their defaults
 * @param scene current BattleScene
 */
export function resetSettings(scene: BattleScene) {
  Setting.forEach(s => setSetting(scene, s.key, s.default));
}

/**
 * Updates a setting for current BattleScene
 * @param scene current BattleScene
 * @param setting string ideally from SettingKeys
 * @param value value to update setting with
 * @returns true if successful, false if not
 */
export function setSetting(scene: BattleScene, setting: string, value: integer): boolean {
  const index: number = settingIndex(setting);
  if ( index === -1) {
    return false;
  }
  switch (Setting[index].key) {
  case SettingKeys.Game_Speed:
    scene.gameSpeed = parseFloat(Setting[index].options[value].replace("x", ""));
    break;
  case SettingKeys.Master_Volume:
    scene.masterVolume = value ? parseInt(Setting[index].options[value]) * 0.01 : 0;
    scene.updateSoundVolume();
    break;
  case SettingKeys.BGM_Volume:
    scene.bgmVolume = value ? parseInt(Setting[index].options[value]) * 0.01 : 0;
    scene.updateSoundVolume();
    break;
  case SettingKeys.SE_Volume:
    scene.seVolume = value ? parseInt(Setting[index].options[value]) * 0.01 : 0;
    scene.updateSoundVolume();
    break;
  case SettingKeys.Music_Preference:
    scene.musicPreference = value;
    break;
  case SettingKeys.Damage_Numbers:
    scene.damageNumbersMode = value;
    break;
  case SettingKeys.UI_Theme:
    scene.uiTheme = value;
    break;
  case SettingKeys.Window_Type:
    updateWindowType(scene, parseInt(Setting[index].options[value]));
    break;
  case SettingKeys.Tutorials:
    scene.enableTutorials = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Move_Info:
    scene.enableMoveInfo = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Enable_Retries:
    scene.enableRetries = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Skip_Seen_Dialogues:
    scene.skipSeenDialogues = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Battle_Style:
    scene.battleStyle = value;
    break;
  case SettingKeys.Candy_Upgrade_Notification:
    if (scene.candyUpgradeNotification === value) {
      break;
    }

    scene.candyUpgradeNotification = value;
    scene.eventTarget.dispatchEvent(new CandyUpgradeNotificationChangedEvent(value));
    break;
  case SettingKeys.Candy_Upgrade_Display:
    scene.candyUpgradeDisplay = value;
  case SettingKeys.Money_Format:
    switch (Setting[index].options[value]) {
    case "Normal":
      scene.moneyFormat = MoneyFormat.NORMAL;
      break;
    case "Abbreviated":
      scene.moneyFormat = MoneyFormat.ABBREVIATED;
      break;
    }
    scene.updateMoneyText(false);
    break;
  case SettingKeys.Sprite_Set:
    scene.experimentalSprites = !!value;
    if (value) {
      scene.initExpSprites();
    }
    break;
  case SettingKeys.Move_Animations:
    scene.moveAnimations = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Show_Moveset_Flyout:
    scene.showMovesetFlyout = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Show_Arena_Flyout:
    scene.showArenaFlyout = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Show_Time_Of_Day_Widget:
    scene.showTimeOfDayWidget = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Time_Of_Day_Animation:
    scene.timeOfDayAnimation = Setting[index].options[value] === "Bounce" ? EaseType.BOUNCE : EaseType.BACK;
    break;
  case SettingKeys.Show_Stats_on_Level_Up:
    scene.showLevelUpStats = Setting[index].options[value] === "On";
    break;
  case SettingKeys.EXP_Gains_Speed:
    scene.expGainsSpeed = value;
    break;
  case SettingKeys.EXP_Party_Display:
    scene.expParty = value;
    break;
  case SettingKeys.HP_Bar_Speed:
    scene.hpBarSpeed = value;
    break;
  case SettingKeys.Fusion_Palette_Swaps:
    scene.fusionPaletteSwaps = !!value;
    break;
  case SettingKeys.Player_Gender:
    if (scene.gameData) {
      const female = Setting[index].options[value] === "Girl";
      scene.gameData.gender = female ? PlayerGender.FEMALE : PlayerGender.MALE;
      scene.trainer.setTexture(scene.trainer.texture.key.replace(female ? "m" : "f", female ? "f" : "m"));
    } else {
      return false;
    }
    break;
  case SettingKeys.Touch_Controls:
    scene.enableTouchControls = Setting[index].options[value] !== "Disabled" && hasTouchscreen();
    const touchControls = document.getElementById("touchControls");
    if (touchControls) {
      touchControls.classList.toggle("visible", scene.enableTouchControls);
    }
    break;
  case SettingKeys.Vibration:
    scene.enableVibration = Setting[index].options[value] !== "Disabled" && hasTouchscreen();
    break;
  case SettingKeys.Type_Hints:
    scene.typeHints = Setting[index].options[value] === "On";
    break;
  case SettingKeys.Language:
    if (value) {
      if (scene.ui) {
        const cancelHandler = () => {
          scene.ui.revertMode();
          (scene.ui.getHandler() as SettingsUiHandler).setOptionCursor(0, 0, true);
        };
        const changeLocaleHandler = (locale: string): boolean => {
          try {
            i18next.changeLanguage(locale);
            localStorage.setItem("prLang", locale);
            cancelHandler();
            // Reload the whole game to apply the new locale since also some constants are translated
            window.location.reload();
            return true;
          } catch (error) {
            console.error("Error changing locale:", error);
            return false;
          }
        };
        scene.ui.setOverlayMode(Mode.OPTION_SELECT, {
          options: [
            {
              label: "English",
              handler: () => changeLocaleHandler("en")
            },
            {
              label: "Español",
              handler: () => changeLocaleHandler("es")
            },
            {
              label: "Italiano",
              handler: () => changeLocaleHandler("it")
            },
            {
              label: "Français",
              handler: () => changeLocaleHandler("fr")
            },
            {
              label: "Deutsch",
              handler: () => changeLocaleHandler("de")
            },
            {
              label: "Português (BR)",
              handler: () => changeLocaleHandler("pt-BR")
            },
            {
              label: "简体中文",
              handler: () => changeLocaleHandler("zh-CN")
            },
            {
              label: "繁體中文",
              handler: () => changeLocaleHandler("zh-TW")
            },
            {
              label: "한국어",
              handler: () => changeLocaleHandler("ko")
            },
            {
              label: "Cancel",
              handler: () => cancelHandler()
            }
          ],
          maxOptions: 7
        });
        return false;
      }
    }
    break;
  }

  return true;
}
