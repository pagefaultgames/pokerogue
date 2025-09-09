import { globalScene } from "#app/global-scene";
import { hasTouchscreen } from "#app/touch-controls";
import { EaseType } from "#enums/ease-type";
import { MoneyFormat } from "#enums/money-format";
import { PlayerGender } from "#enums/player-gender";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { UiMode } from "#enums/ui-mode";
import { CandyUpgradeNotificationChangedEvent } from "#events/battle-scene";
import type { SettingsUiHandler } from "#ui/settings-ui-handler";
import { updateWindowType } from "#ui/ui-theme";
import { isLocal } from "#utils/common";
import i18next from "i18next";

const VOLUME_OPTIONS: SettingOption[] = [
  {
    value: "Mute",
    label: i18next.t("settings:mute"),
  },
];
for (let i = 1; i < 11; i++) {
  const value = (i * 10).toString();
  VOLUME_OPTIONS.push({ value, label: value });
}

const SHOP_OVERLAY_OPACITY_OPTIONS: SettingOption[] = [];
for (let i = 0; i < 9; i++) {
  const value = ((i + 1) * 10).toString();
  SHOP_OVERLAY_OPACITY_OPTIONS.push({ value, label: value });
}

const OFF_ON: SettingOption[] = [
  {
    value: "Off",
    label: i18next.t("settings:off"),
  },
  {
    value: "On",
    label: i18next.t("settings:on"),
  },
];

const AUTO_DISABLED: SettingOption[] = [
  {
    value: "Auto",
    label: i18next.t("settings:auto"),
  },
  {
    value: "Disabled",
    label: i18next.t("settings:disabled"),
  },
];

const TOUCH_CONTROLS_OPTIONS: SettingOption[] = [
  {
    value: "Auto",
    label: i18next.t("settings:auto"),
  },
  {
    value: "Disabled",
    label: i18next.t("settings:disabled"),
    needConfirmation: true,
    confirmationMessage: i18next.t("settings:confirmDisableTouch"),
  },
];

const SHOP_CURSOR_TARGET_OPTIONS: SettingOption[] = [
  {
    value: "Rewards",
    label: i18next.t("settings:rewards"),
  },
  {
    value: "Shop",
    label: i18next.t("settings:shop"),
  },
  {
    value: "Reroll",
    label: i18next.t("settings:reroll"),
  },
  {
    value: "Check Team",
    label: i18next.t("settings:checkTeam"),
  },
];

const shopCursorTargetIndexMap = SHOP_CURSOR_TARGET_OPTIONS.map(option => {
  switch (option.value) {
    case "Rewards":
      return ShopCursorTarget.REWARDS;
    case "Shop":
      return ShopCursorTarget.SHOP;
    case "Reroll":
      return ShopCursorTarget.REROLL;
    case "Check Team":
      return ShopCursorTarget.CHECK_TEAM;
    default:
      throw new Error(`Unknown value: ${option.value}`);
  }
});

/**
 * Types for helping separate settings to different menus
 */
export enum SettingType {
  GENERAL,
  DISPLAY,
  AUDIO,
}

type SettingOption = {
  value: string;
  label: string;
  needConfirmation?: boolean;
  confirmationMessage?: string;
};

export interface Setting {
  key: string;
  label: string;
  options: SettingOption[];
  default: number;
  type: SettingType;
  requireReload?: boolean;
  /** Whether the setting can be activated or not */
  activatable?: boolean;
  /** Determines whether the setting should be hidden from the UI */
  isHidden?: () => boolean;
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
  Egg_Skip: "EGG_SKIP",
  Battle_Style: "BATTLE_STYLE",
  Enable_Retries: "ENABLE_RETRIES",
  Hide_IVs: "HIDE_IVS",
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
  Shop_Cursor_Target: "SHOP_CURSOR_TARGET",
  Command_Cursor_Memory: "COMMAND_CURSOR_MEMORY",
  Dex_For_Devs: "DEX_FOR_DEVS",
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
  Field_Volume: "FIELD_VOLUME",
  SE_Volume: "SE_VOLUME",
  UI_Volume: "UI_SOUND_EFFECTS",
  Battle_Music: "BATTLE_MUSIC",
  Show_BGM_Bar: "SHOW_BGM_BAR",
  Hide_Username: "HIDE_USERNAME",
  Move_Touch_Controls: "MOVE_TOUCH_CONTROLS",
  Shop_Overlay_Opacity: "SHOP_OVERLAY_OPACITY",
};

export enum MusicPreference {
  GENFIVE,
  ALLGENS,
}

const windowTypeOptions: SettingOption[] = [];
for (let i = 0; i < 5; i++) {
  const value = (i + 1).toString();
  windowTypeOptions.push({ value, label: value });
}

/**
 * All Settings not related to controls
 */
export const Setting: Array<Setting> = [
  {
    key: SettingKeys.Game_Speed,
    label: i18next.t("settings:gameSpeed"),
    options: [
      {
        value: "1",
        label: i18next.t("settings:gameSpeed100x"),
      },
      {
        value: "1.25",
        label: i18next.t("settings:gameSpeed125x"),
      },
      {
        value: "1.5",
        label: i18next.t("settings:gameSpeed150x"),
      },
      {
        value: "2",
        label: i18next.t("settings:gameSpeed200x"),
      },
      {
        value: "2.5",
        label: i18next.t("settings:gameSpeed250x"),
      },
      {
        value: "3",
        label: i18next.t("settings:gameSpeed300x"),
      },
      {
        value: "4",
        label: i18next.t("settings:gameSpeed400x"),
      },
      {
        value: "5",
        label: i18next.t("settings:gameSpeed500x"),
      },
    ],
    default: 3,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.HP_Bar_Speed,
    label: i18next.t("settings:hpBarSpeed"),
    options: [
      {
        value: "Normal",
        label: i18next.t("settings:normal"),
      },
      {
        value: "Fast",
        label: i18next.t("settings:fast"),
      },
      {
        value: "Faster",
        label: i18next.t("settings:faster"),
      },
      {
        value: "Skip",
        label: i18next.t("settings:skip"),
      },
    ],
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.EXP_Gains_Speed,
    label: i18next.t("settings:expGainsSpeed"),
    options: [
      {
        value: "Normal",
        label: i18next.t("settings:normal"),
      },
      {
        value: "Fast",
        label: i18next.t("settings:fast"),
      },
      {
        value: "Faster",
        label: i18next.t("settings:faster"),
      },
      {
        value: "Skip",
        label: i18next.t("settings:skip"),
      },
    ],
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.EXP_Party_Display,
    label: i18next.t("settings:expPartyDisplay"),
    options: [
      {
        value: "Normal",
        label: i18next.t("settings:normal"),
      },
      {
        value: "Level Up Notification",
        label: i18next.t("settings:levelUpNotifications"),
      },
      {
        value: "Skip",
        label: i18next.t("settings:skip"),
      },
    ],
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Skip_Seen_Dialogues,
    label: i18next.t("settings:skipSeenDialogues"),
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Egg_Skip,
    label: i18next.t("settings:eggSkip"),
    options: [
      {
        value: "Never",
        label: i18next.t("settings:never"),
      },
      {
        value: "Ask",
        label: i18next.t("settings:ask"),
      },
      {
        value: "Always",
        label: i18next.t("settings:always"),
      },
    ],
    default: 1,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Battle_Style,
    label: i18next.t("settings:battleStyle"),
    options: [
      {
        value: "Switch",
        label: i18next.t("settings:switch"),
      },
      {
        value: "Set",
        label: i18next.t("settings:set"),
      },
    ],
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Command_Cursor_Memory,
    label: i18next.t("settings:commandCursorMemory"),
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Enable_Retries,
    label: i18next.t("settings:enableRetries"),
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Hide_IVs,
    label: i18next.t("settings:hideIvs"),
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Tutorials,
    label: i18next.t("settings:tutorials"),
    options: OFF_ON,
    default: 1,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Vibration,
    label: i18next.t("settings:vibrations"),
    options: AUTO_DISABLED,
    default: 0,
    type: SettingType.GENERAL,
  },
  {
    key: SettingKeys.Touch_Controls,
    label: i18next.t("settings:touchControls"),
    options: TOUCH_CONTROLS_OPTIONS,
    default: 0,
    type: SettingType.GENERAL,
    isHidden: () => !hasTouchscreen(),
  },
  {
    key: SettingKeys.Move_Touch_Controls,
    label: i18next.t("settings:moveTouchControls"),
    options: [
      {
        value: "Configure",
        label: i18next.t("settings:change"),
      },
    ],
    default: 0,
    type: SettingType.GENERAL,
    activatable: true,
    isHidden: () => !hasTouchscreen(),
  },
  {
    key: SettingKeys.Language,
    label: i18next.t("settings:language"),
    options: [
      {
        value: "English",
        label: "English",
      },
      {
        value: "Change",
        label: i18next.t("settings:change"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.UI_Theme,
    label: i18next.t("settings:uiTheme"),
    options: [
      {
        value: "Default",
        label: i18next.t("settings:default"),
      },
      {
        value: "Legacy",
        label: i18next.t("settings:legacy"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.Window_Type,
    label: i18next.t("settings:windowType"),
    options: windowTypeOptions,
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Money_Format,
    label: i18next.t("settings:moneyFormat"),
    options: [
      {
        value: "Normal",
        label: i18next.t("settings:normal"),
      },
      {
        value: "Abbreviated",
        label: i18next.t("settings:abbreviated"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Damage_Numbers,
    label: i18next.t("settings:damageNumbers"),
    options: [
      {
        value: "Off",
        label: i18next.t("settings:off"),
      },
      {
        value: "Simple",
        label: i18next.t("settings:simple"),
      },
      {
        value: "Fancy",
        label: i18next.t("settings:fancy"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Move_Animations,
    label: i18next.t("settings:moveAnimations"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Show_Stats_on_Level_Up,
    label: i18next.t("settings:showStatsOnLevelUp"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Candy_Upgrade_Notification,
    label: i18next.t("settings:candyUpgradeNotification"),
    options: [
      {
        value: "Off",
        label: i18next.t("settings:off"),
      },
      {
        value: "Passives Only",
        label: i18next.t("settings:passivesOnly"),
      },
      {
        value: "On",
        label: i18next.t("settings:on"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Candy_Upgrade_Display,
    label: i18next.t("settings:candyUpgradeDisplay"),
    options: [
      {
        value: "Icon",
        label: i18next.t("settings:icon"),
      },
      {
        value: "Animation",
        label: i18next.t("settings:animation"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.Move_Info,
    label: i18next.t("settings:moveInfo"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Show_Moveset_Flyout,
    label: i18next.t("settings:showMovesetFlyout"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Show_Arena_Flyout,
    label: i18next.t("settings:showArenaFlyout"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Show_Time_Of_Day_Widget,
    label: i18next.t("settings:showTimeOfDayWidget"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.Time_Of_Day_Animation,
    label: i18next.t("settings:timeOfDayAnimation"),
    options: [
      {
        value: "Bounce",
        label: i18next.t("settings:bounce"),
      },
      {
        value: "Back",
        label: i18next.t("settings:timeOfDayBack"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Sprite_Set,
    label: i18next.t("settings:spriteSet"),
    options: [
      {
        value: "Consistent",
        label: i18next.t("settings:consistent"),
      },
      {
        value: "Experimental",
        label: i18next.t("settings:experimental"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
    requireReload: true,
  },
  {
    key: SettingKeys.Fusion_Palette_Swaps,
    label: i18next.t("settings:fusionPaletteSwaps"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Player_Gender,
    label: i18next.t("settings:playerGender"),
    options: [
      {
        value: "Boy",
        label: i18next.t("settings:boy"),
      },
      {
        value: "Girl",
        label: i18next.t("settings:girl"),
      },
    ],
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Type_Hints,
    label: i18next.t("settings:typeHints"),
    options: OFF_ON,
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Show_BGM_Bar,
    label: i18next.t("settings:showBgmBar"),
    options: OFF_ON,
    default: 1,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Hide_Username,
    label: i18next.t("settings:hideUsername"),
    options: OFF_ON,
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Master_Volume,
    label: i18next.t("settings:masterVolume"),
    options: VOLUME_OPTIONS,
    default: 5,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.BGM_Volume,
    label: i18next.t("settings:bgmVolume"),
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.Field_Volume,
    label: i18next.t("settings:fieldVolume"),
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.SE_Volume,
    label: i18next.t("settings:seVolume"),
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.UI_Volume,
    label: i18next.t("settings:uiVolume"),
    options: VOLUME_OPTIONS,
    default: 10,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.Battle_Music,
    label: i18next.t("settings:battleMusic"),
    options: [
      {
        value: "Gen V",
        label: i18next.t("settings:musicGenFive"),
      },
      {
        value: "All Gens",
        label: i18next.t("settings:musicAllGens"),
      },
    ],
    default: MusicPreference.ALLGENS,
    type: SettingType.AUDIO,
    requireReload: true,
  },
  {
    key: SettingKeys.Shop_Cursor_Target,
    label: i18next.t("settings:shopCursorTarget"),
    options: SHOP_CURSOR_TARGET_OPTIONS,
    default: 0,
    type: SettingType.DISPLAY,
  },
  {
    key: SettingKeys.Shop_Overlay_Opacity,
    label: i18next.t("settings:shopOverlayOpacity"),
    options: SHOP_OVERLAY_OPACITY_OPTIONS,
    default: 7,
    type: SettingType.DISPLAY,
    requireReload: false,
  },
];

if (isLocal) {
  Setting.push({
    key: SettingKeys.Dex_For_Devs,
    label: i18next.t("settings:dexForDevs"),
    options: OFF_ON,
    default: 0,
    type: SettingType.GENERAL,
  });
}

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
 */
export function resetSettings() {
  for (const s of Setting) {
    setSetting(s.key, s.default);
  }
}

/**
 * Updates a setting
 * @param setting string ideally from SettingKeys
 * @param value value to update setting with
 * @returns true if successful, false if not
 */
export function setSetting(setting: string, value: number): boolean {
  const index: number = settingIndex(setting);
  if (index === -1) {
    return false;
  }
  switch (Setting[index].key) {
    case SettingKeys.Game_Speed:
      globalScene.gameSpeed = Number.parseFloat(Setting[index].options[value].value.replace("x", ""));
      break;
    case SettingKeys.Master_Volume:
      globalScene.masterVolume = value ? Number.parseInt(Setting[index].options[value].value) * 0.01 : 0;
      globalScene.updateSoundVolume();
      break;
    case SettingKeys.BGM_Volume:
      globalScene.bgmVolume = value ? Number.parseInt(Setting[index].options[value].value) * 0.01 : 0;
      globalScene.updateSoundVolume();
      break;
    case SettingKeys.Field_Volume:
      globalScene.fieldVolume = value ? Number.parseInt(Setting[index].options[value].value) * 0.01 : 0;
      globalScene.updateSoundVolume();
      break;
    case SettingKeys.SE_Volume:
      globalScene.seVolume = value ? Number.parseInt(Setting[index].options[value].value) * 0.01 : 0;
      globalScene.updateSoundVolume();
      break;
    case SettingKeys.UI_Volume:
      globalScene.uiVolume = value ? Number.parseInt(Setting[index].options[value].value) * 0.01 : 0;
      break;
    case SettingKeys.Battle_Music:
      globalScene.musicPreference = value;
      break;
    case SettingKeys.Damage_Numbers:
      globalScene.damageNumbersMode = value;
      break;
    case SettingKeys.UI_Theme:
      globalScene.uiTheme = value;
      break;
    case SettingKeys.Window_Type:
      updateWindowType(Number.parseInt(Setting[index].options[value].value));
      break;
    case SettingKeys.Tutorials:
      globalScene.enableTutorials = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Move_Info:
      globalScene.enableMoveInfo = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Enable_Retries:
      globalScene.enableRetries = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Hide_IVs:
      globalScene.hideIvs = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Skip_Seen_Dialogues:
      globalScene.skipSeenDialogues = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Egg_Skip:
      globalScene.eggSkipPreference = value;
      break;
    case SettingKeys.Battle_Style:
      globalScene.battleStyle = value;
      break;
    case SettingKeys.Show_BGM_Bar:
      globalScene.showBgmBar = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Hide_Username:
      globalScene.hideUsername = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Candy_Upgrade_Notification:
      if (globalScene.candyUpgradeNotification === value) {
        break;
      }
      globalScene.candyUpgradeNotification = value;
      globalScene.eventTarget.dispatchEvent(new CandyUpgradeNotificationChangedEvent(value));
      break;
    case SettingKeys.Candy_Upgrade_Display:
      globalScene.candyUpgradeDisplay = value;
      break;
    case SettingKeys.Money_Format:
      switch (Setting[index].options[value].value) {
        case "Normal":
          globalScene.moneyFormat = MoneyFormat.NORMAL;
          break;
        case "Abbreviated":
          globalScene.moneyFormat = MoneyFormat.ABBREVIATED;
          break;
      }
      globalScene.updateMoneyText(false);
      break;
    case SettingKeys.Sprite_Set:
      globalScene.experimentalSprites = !!value;
      if (value) {
        globalScene.initExpSprites();
      }
      break;
    case SettingKeys.Move_Animations:
      globalScene.moveAnimations = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Show_Moveset_Flyout:
      globalScene.showMovesetFlyout = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Show_Arena_Flyout:
      globalScene.showArenaFlyout = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Show_Time_Of_Day_Widget:
      globalScene.showTimeOfDayWidget = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Time_Of_Day_Animation:
      globalScene.timeOfDayAnimation =
        Setting[index].options[value].value === "Bounce" ? EaseType.BOUNCE : EaseType.BACK;
      break;
    case SettingKeys.Show_Stats_on_Level_Up:
      globalScene.showLevelUpStats = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Shop_Cursor_Target: {
      const selectedValue = shopCursorTargetIndexMap[value];
      globalScene.shopCursorTarget = selectedValue;
      break;
    }
    case SettingKeys.Command_Cursor_Memory:
      globalScene.commandCursorMemory = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Dex_For_Devs:
      globalScene.dexForDevs = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.EXP_Gains_Speed:
      globalScene.expGainsSpeed = value;
      break;
    case SettingKeys.EXP_Party_Display:
      globalScene.expParty = value;
      break;
    case SettingKeys.HP_Bar_Speed:
      globalScene.hpBarSpeed = value;
      break;
    case SettingKeys.Fusion_Palette_Swaps:
      globalScene.fusionPaletteSwaps = !!value;
      break;
    case SettingKeys.Player_Gender:
      if (globalScene.gameData) {
        const female = Setting[index].options[value].value === "Girl";
        globalScene.gameData.gender = female ? PlayerGender.FEMALE : PlayerGender.MALE;
        globalScene.trainer.setTexture(globalScene.trainer.texture.key.replace(female ? "m" : "f", female ? "f" : "m"));
      } else {
        return false;
      }
      break;
    case SettingKeys.Touch_Controls: {
      globalScene.enableTouchControls = Setting[index].options[value].value !== "Disabled" && hasTouchscreen();
      const touchControls = document.getElementById("touchControls");
      if (touchControls) {
        touchControls.classList.toggle("visible", globalScene.enableTouchControls);
      }
      break;
    }
    case SettingKeys.Vibration:
      globalScene.enableVibration = Setting[index].options[value].value !== "Disabled" && hasTouchscreen();
      break;
    case SettingKeys.Type_Hints:
      globalScene.typeHints = Setting[index].options[value].value === "On";
      break;
    case SettingKeys.Language:
      if (value && globalScene.ui) {
        const cancelHandler = () => {
          globalScene.ui.revertMode();
          (globalScene.ui.getHandler() as SettingsUiHandler).setOptionCursor(-1, 0, true);
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
        globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
          options: [
            {
              label: "English",
              handler: () => changeLocaleHandler("en"),
            },
            {
              label: "Español (ES)",
              handler: () => changeLocaleHandler("es-ES"),
            },
            {
              label: "Español (LATAM)",
              handler: () => changeLocaleHandler("es-MX"),
            },
            {
              label: "Français",
              handler: () => changeLocaleHandler("fr"),
            },
            {
              label: "Deutsch",
              handler: () => changeLocaleHandler("de"),
            },
            {
              label: "Italiano",
              handler: () => changeLocaleHandler("it"),
            },
            {
              label: "Português (BR)",
              handler: () => changeLocaleHandler("pt-BR"),
            },
            {
              label: "한국어",
              handler: () => changeLocaleHandler("ko"),
            },
            {
              label: "日本語",
              handler: () => changeLocaleHandler("ja"),
            },
            {
              label: "简体中文",
              handler: () => changeLocaleHandler("zh-CN"),
            },
            {
              label: "繁體中文",
              handler: () => changeLocaleHandler("zh-TW"),
            },
            {
              label: "Català (Needs Help)",
              handler: () => changeLocaleHandler("ca"),
            },
            {
              label: "Türkçe (Needs Help)",
              handler: () => changeLocaleHandler("tr"),
            },
            {
              label: "Русский (Needs Help)",
              handler: () => changeLocaleHandler("ru"),
            },
            {
              label: "Dansk (Needs Help)",
              handler: () => changeLocaleHandler("da"),
            },
            {
              label: "Română (Needs Help)",
              handler: () => changeLocaleHandler("ro"),
            },
            {
              label: "Tagalog (Needs Help)",
              handler: () => changeLocaleHandler("tl"),
            },
            {
              label: i18next.t("settings:back"),
              handler: () => cancelHandler(),
            },
          ],
          maxOptions: 7,
        });
        return false;
      }
      break;
    case SettingKeys.Shop_Overlay_Opacity:
      globalScene.updateShopOverlayOpacity(Number.parseInt(Setting[index].options[value].value) * 0.01);
      break;
  }

  return true;
}
