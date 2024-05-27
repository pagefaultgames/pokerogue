import SettingsUiHandler from "#app/ui/settings-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import BattleScene from "../battle-scene";
import { hasTouchscreen } from "../touch-controls";
import { updateWindowType } from "../ui/ui-theme";
import { PlayerGender } from "./game-data";
import { MoneyFormat } from "../enums/money-format";

export enum Setting {
  Game_Speed = "GAME_SPEED",
  Master_Volume = "MASTER_VOLUME",
  BGM_Volume = "BGM_VOLUME",
  SE_Volume = "SE_VOLUME",
  Language = "LANGUAGE",
  Damage_Numbers = "DAMAGE_NUMBERS",
  UI_Theme = "UI_THEME",
  Window_Type = "WINDOW_TYPE",
  Tutorials = "TUTORIALS",
  Enable_Retries = "ENABLE_RETRIES",
  Money_Format = "MONEY_FORMAT",
  Sprite_Set = "SPRITE_SET",
  Move_Animations = "MOVE_ANIMATIONS",
  Show_Stats_on_Level_Up = "SHOW_LEVEL_UP_STATS",
  EXP_Gains_Speed = "EXP_GAINS_SPEED",
  EXP_Party_Display = "EXP_PARTY_DISPLAY",
  HP_Bar_Speed = "HP_BAR_SPEED",
  Fusion_Palette_Swaps = "FUSION_PALETTE_SWAPS",
  Player_Gender = "PLAYER_GENDER",
  Gamepad_Support = "GAMEPAD_SUPPORT",
  Swap_A_and_B = "SWAP_A_B", // Swaps which gamepad button handles ACTION and CANCEL
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
  [Setting.Game_Speed]: ["1x", "1.25x", "1.5x", "2x", "2.5x", "3x", "4x", "5x"],
  [Setting.Master_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : "Mute"),
  [Setting.BGM_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : "Mute"),
  [Setting.SE_Volume]: new Array(11).fill(null).map((_, i) => i ? (i * 10).toString() : "Mute"),
  [Setting.Language]: ["English", "Change"],
  [Setting.Damage_Numbers]: ["Off", "Simple", "Fancy"],
  [Setting.UI_Theme]: ["Default", "Legacy"],
  [Setting.Window_Type]: new Array(5).fill(null).map((_, i) => (i + 1).toString()),
  [Setting.Tutorials]: ["Off", "On"],
  [Setting.Enable_Retries]: ["Off", "On"],
  [Setting.Money_Format]: ["Normal", "Abbreviated"],
  [Setting.Sprite_Set]: ["Consistent", "Mixed Animated"],
  [Setting.Move_Animations]: ["Off", "On"],
  [Setting.Show_Stats_on_Level_Up]: ["Off", "On"],
  [Setting.EXP_Gains_Speed]: ["Normal", "Fast", "Faster", "Skip"],
  [Setting.EXP_Party_Display]: ["Normal", "Level Up Notification", "Skip"],
  [Setting.HP_Bar_Speed]: ["Normal", "Fast", "Faster", "Instant"],
  [Setting.Fusion_Palette_Swaps]: ["Off", "On"],
  [Setting.Player_Gender]: ["Boy", "Girl"],
  [Setting.Gamepad_Support]: ["Auto", "Disabled"],
  [Setting.Swap_A_and_B]: ["Enabled", "Disabled"],
  [Setting.Touch_Controls]: ["Auto", "Disabled"],
  [Setting.Vibration]: ["Auto", "Disabled"]
};

export const settingDefaults: SettingDefaults = {
  [Setting.Game_Speed]: 3,
  [Setting.Master_Volume]: 5,
  [Setting.BGM_Volume]: 10,
  [Setting.SE_Volume]: 10,
  [Setting.Language]: 0,
  [Setting.Damage_Numbers]: 0,
  [Setting.UI_Theme]: 0,
  [Setting.Window_Type]: 0,
  [Setting.Tutorials]: 1,
  [Setting.Enable_Retries]: 0,
  [Setting.Money_Format]: 0,
  [Setting.Sprite_Set]: 0,
  [Setting.Move_Animations]: 1,
  [Setting.Show_Stats_on_Level_Up]: 1,
  [Setting.EXP_Gains_Speed]: 0,
  [Setting.EXP_Party_Display]: 0,
  [Setting.HP_Bar_Speed]: 0,
  [Setting.Fusion_Palette_Swaps]: 1,
  [Setting.Player_Gender]: 0,
  [Setting.Gamepad_Support]: 0,
  [Setting.Swap_A_and_B]: 1, // Set to 'Disabled' by default
  [Setting.Touch_Controls]: 0,
  [Setting.Vibration]: 0
};

export const reloadSettings: Setting[] = [Setting.UI_Theme, Setting.Language, Setting.Sprite_Set];

export function setSetting(scene: BattleScene, setting: Setting, value: integer): boolean {
  switch (setting) {
  case Setting.Game_Speed:
    scene.gameSpeed = parseFloat(settingOptions[setting][value].replace("x", ""));
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
  case Setting.UI_Theme:
    scene.uiTheme = value;
    break;
  case Setting.Window_Type:
    updateWindowType(scene, parseInt(settingOptions[setting][value]));
    break;
  case Setting.Tutorials:
    scene.enableTutorials = settingOptions[setting][value] === "On";
    break;
  case Setting.Enable_Retries:
    scene.enableRetries = settingOptions[setting][value] === "On";
    break;
  case Setting.Money_Format:
    switch (settingOptions[setting][value]) {
    case "Normal":
      scene.moneyFormat = MoneyFormat.NORMAL;
      break;
    case "Abbreviated":
      scene.moneyFormat = MoneyFormat.ABBREVIATED;
      break;
    }
    scene.updateMoneyText(false);
    break;
  case Setting.Sprite_Set:
    scene.experimentalSprites = !!value;
    if (value) {
      scene.initExpSprites();
    }
    break;
  case Setting.Move_Animations:
    scene.moveAnimations = settingOptions[setting][value] === "On";
    break;
  case Setting.Show_Stats_on_Level_Up:
    scene.showLevelUpStats = settingOptions[setting][value] === "On";
    break;
  case Setting.EXP_Gains_Speed:
    scene.expGainsSpeed = value;
    break;
  case Setting.EXP_Party_Display:
    scene.expParty = value;
    break;
  case Setting.HP_Bar_Speed:
    scene.hpBarSpeed = value;
    break;
  case Setting.Fusion_Palette_Swaps:
    scene.fusionPaletteSwaps = !!value;
    break;
  case Setting.Player_Gender:
    if (scene.gameData) {
      const female = settingOptions[setting][value] === "Girl";
      scene.gameData.gender = female ? PlayerGender.FEMALE : PlayerGender.MALE;
      scene.trainer.setTexture(scene.trainer.texture.key.replace(female ? "m" : "f", female ? "f" : "m"));
    } else {
      return false;
    }
    break;
  case Setting.Gamepad_Support:
    // if we change the value of the gamepad support, we call a method in the inputController to
    // activate or deactivate the controller listener
    scene.inputController.setGamepadSupport(settingOptions[setting][value] !== "Disabled");
    break;
  case Setting.Swap_A_and_B:
    scene.abSwapped = settingOptions[setting][value] !== "Disabled";
    break;
  case Setting.Touch_Controls:
    scene.enableTouchControls = settingOptions[setting][value] !== "Disabled" && hasTouchscreen();
    const touchControls = document.getElementById("touchControls");
    if (touchControls) {
      touchControls.classList.toggle("visible", scene.enableTouchControls);
    }
    break;
  case Setting.Vibration:
    scene.enableVibration = settingOptions[setting][value] !== "Disabled" && hasTouchscreen();
    break;
  case Setting.Language:
    if (value) {
      if (scene.ui) {
        const cancelHandler = () => {
          scene.ui.revertMode();
          (scene.ui.getHandler() as SettingsUiHandler).setOptionCursor(Object.values(Setting).indexOf(Setting.Language), 0, true);
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
              handler: () => changeLocaleHandler("pt_BR")
            },
            {
              label: "简体中文",
              handler: () => changeLocaleHandler("zh_CN")
            },
            {
              label: "繁體中文",
              handler: () => changeLocaleHandler("zh_TW")
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
