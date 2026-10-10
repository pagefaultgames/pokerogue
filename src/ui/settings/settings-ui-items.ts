import { isDev } from "#constants/app-constants";
import { BattleStyle } from "#enums/battle-style";
import { CandyUpgradeDisplayMode } from "#enums/candy-upgrade-display-mode";
import { CandyUpgradeNotificationMode } from "#enums/candy-upgrade-notification-mode";
import { DamageNumbersMode } from "#enums/damage-numbers-mode";
import { EaseType } from "#enums/ease-type";
import { EggSkipPreference } from "#enums/egg-skip-preference";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { GameSpeed } from "#enums/game-speed";
import { HpBarSpeed } from "#enums/hp-bar-speed";
import { MoneyFormat } from "#enums/money-format";
import { MusicPreference } from "#enums/music-preference";
import { PlayerGender } from "#enums/player-gender";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpriteSet } from "#enums/sprite-set";
import { TypeHints } from "#enums/type-hints";
import { UiTheme } from "#enums/ui-theme";
import { SUPPORTED_LANGUAGE_ENTRIES } from "#system/supported-languages";
import type {
  AudioSettingsKey,
  DisplaySettingsKey,
  GeneralSettingsKey,
  SettingsUiItem,
  SettingUiItemOption,
} from "#types/settings";
import i18next, { t } from "i18next";

// #region Types

type UseOptionInit = Pick<SettingUiItemOption, "requiresConfirmation" | "confirmationMessage">;

// #endregion Types

// #region Helper Functions

/**
 * Creates an array with "on/off" options.
 * @param onInit - (Optional) Initial settings for "on" option
 * @param offInit - (Optional) Initial settings for "off" option
 * @returns On/off options array
 */
function useOnOffOptions(onInit: UseOptionInit = {}, offInit: UseOptionInit = {}): SettingUiItemOption[] {
  return [
    { value: false, label: t("settings:off"), ...offInit },
    { value: true, label: t("settings:on"), ...onInit },
  ];
}

/**
 * Creates an array with "auto/disabled" options.
 * @param autoInit - (Optional) Initial settings for "auto" option
 * @param disabledInit - (Optional) Initial settings for "disabled" option
 * @returns Auto/disabled options array
 */
function useAutoDisabledOptions(autoInit: UseOptionInit = {}, disabledInit: UseOptionInit = {}): SettingUiItemOption[] {
  return [
    { value: true, label: t("settings:auto"), ...autoInit },
    { value: false, label: t("settings:disabled"), ...disabledInit },
  ];
}

/**
 * Creates an array with volume options ranging from 0/mute - 100 in 10 steps
 * @returns An array from 0 - 100
 */
function useVolumeOptions(): SettingUiItemOption[] {
  return Array.from({ length: 11 }).map((_, i) => ({
    value: Number((i * 0.1).toFixed(1)),
    label: i > 0 ? `${i * 10}` : t("settings:mute"),
  }));
}

// #endregion Helper Functions

// #region General Settings

/** UI items for general settings */
export const generalSettingsUiItems: SettingsUiItem<GeneralSettingsKey>[] = [
  {
    key: "gameSpeed",
    label: t("settings:gameSpeed"),
    options: [
      { value: GameSpeed.SLOW, label: t("settings:gameSpeedSlow") },
      { value: GameSpeed.NORMAL, label: t("settings:gameSpeedNormal") },
      { value: GameSpeed.FAST, label: t("settings:gameSpeedFast") },
      { value: GameSpeed.TURBO, label: t("settings:gameSpeedTurbo") },
    ],
  },
  {
    key: "hpBarSpeed",
    label: t("settings:hpBarSpeed"),
    options: [
      { value: HpBarSpeed.DEFAULT, label: t("settings:normal") },
      { value: HpBarSpeed.FAST, label: t("settings:fast") },
      { value: HpBarSpeed.FASTER, label: t("settings:faster") },
      { value: HpBarSpeed.SKIP, label: t("settings:skip") },
    ],
  },
  {
    key: "expGainsSpeed",
    label: t("settings:expGainsSpeed"),
    options: [
      { value: ExpGainsSpeed.DEFAULT, label: t("settings:normal") },
      { value: ExpGainsSpeed.FAST, label: t("settings:fast") },
      { value: ExpGainsSpeed.FASTER, label: t("settings:faster") },
      { value: ExpGainsSpeed.SKIP, label: t("settings:skip") },
    ],
  },
  {
    key: "partyExpNotificationMode",
    label: t("settings:expPartyDisplay"),
    options: [
      { value: ExpNotification.DEFAULT, label: t("settings:normal") },
      { value: ExpNotification.ONLY_LEVEL_UP, label: t("settings:levelUpNotifications") },
      { value: ExpNotification.SKIP, label: t("settings:skip") },
    ],
  },
  {
    key: "playerGender",
    label: t("settings:playerGender"),
    options: [
      { value: PlayerGender.MALE, label: t("settings:boy") },
      { value: PlayerGender.FEMALE, label: t("settings:girl") },
    ],
  },
  {
    key: "skipSeenDialogues",
    label: t("settings:skipSeenDialogues"),
    options: useOnOffOptions(),
  },
  {
    key: "manualMessageClear",
    label: i18next.t("settings:alwaysPromptMessages"),
    options: useOnOffOptions(),
  },
  {
    key: "eggSkipPreference",
    label: t("settings:eggSkip"),
    options: [
      { value: EggSkipPreference.NEVER, label: t("settings:never") },
      { value: EggSkipPreference.ASK, label: t("settings:ask") },
      { value: EggSkipPreference.ALWAYS, label: t("settings:always") },
    ],
  },
  {
    key: "battleStyle",
    label: t("settings:battleStyle"),
    options: [
      { value: BattleStyle.SWITCH, label: t("settings:switch") },
      { value: BattleStyle.SET, label: t("settings:set") },
    ],
  },
  {
    key: "battleCursorMemory",
    label: t("settings:commandCursorMemory"),
    options: useOnOffOptions(),
  },
  {
    key: "enableRetries",
    label: t("settings:enableRetries"),
    options: useOnOffOptions(),
  },
  {
    key: "hideIvScanner",
    label: t("settings:hideIvs"),
    options: useOnOffOptions(),
  },
  {
    key: "levelMoveConfirmation",
    label: t("settings:hideMoveSkipConfirm"),
    options: [
      {
        value: false,
        label: t("settings:skip"),
      },
      {
        value: true,
        label: t("settings:confirm"),
      },
    ],
  },
  {
    key: "enableTutorials",
    label: t("settings:tutorials"),
    options: useOnOffOptions(),
  },
  {
    key: "enableVibration",
    label: t("settings:vibrations"),
    options: useAutoDisabledOptions(),
  },
  {
    key: "enableTouchControls",
    label: t("settings:touchControls"),
    options: useAutoDisabledOptions(
      {},
      { requiresConfirmation: true, confirmationMessage: t("settings:confirmDisableTouch") },
    ),
    touchscreenOnly: true,
  },
  {
    key: "moveTouchControls",
    label: t("settings:moveTouchControls"),
    options: [
      {
        value: 0,
        // Replaced with the actual label in `GeneralSettingsUiHandler#updateMoveTouchControlsSettingsLabel`
        label: "ORIENTATION",
      },
      {
        value: 1,
        label: t("settings:configure"),
      },
    ],
    touchscreenOnly: true,
  },
  {
    key: "preferBatonPass",
    label: t("settings:preferBatonPass"),
    options: useOnOffOptions(),
  },
];

if (isDev) {
  generalSettingsUiItems.push({
    key: "dexForDevs",
    label: t("settings:dexForDevs"),
    options: useOnOffOptions(),
  });
}

// #endregion General Settings

// #region Display Settings

/** UI items for display settings */
export const displaySettingUiItems: SettingsUiItem<DisplaySettingsKey>[] = [
  {
    key: "language",
    label: t("settings:language"),
    options: [
      {
        label: SUPPORTED_LANGUAGE_ENTRIES[i18next.resolvedLanguage ?? "en"]?.label ?? "English",
        value: 0,
      },
      {
        label: t("settings:change"),
        value: 1,
      },
    ],
    requiresReload: true,
  },
  {
    key: "uiTheme",
    label: t("settings:uiTheme"),
    options: [
      { value: UiTheme.DEFAULT, label: t("settings:default") },
      { value: UiTheme.LEGACY, label: t("settings:legacy") },
    ],
    requiresReload: true,
  },
  {
    key: "uiWindowStyle",
    label: t("settings:windowType"),
    options: Array.from({ length: 5 }).map((_, i) => ({ value: i + 1, label: `${i + 1}` })),
  },
  {
    key: "moneyFormat",
    label: t("settings:moneyFormat"),
    options: [
      { value: MoneyFormat.NORMAL, label: t("settings:normal") },
      { value: MoneyFormat.ABBREVIATED, label: t("settings:abbreviated") },
    ],
  },
  {
    key: "damageNumbersMode",
    label: t("settings:damageNumbers"),
    options: [
      { value: DamageNumbersMode.OFF, label: t("settings:off") },
      { value: DamageNumbersMode.SIMPLE, label: t("settings:simple") },
      { value: DamageNumbersMode.FANCY, label: t("settings:fancy") },
    ],
  },
  {
    key: "enableMoveAnimations",
    label: t("settings:moveAnimations"),
    options: useOnOffOptions(),
  },
  {
    key: "showStatsOnLevelUp",
    label: t("settings:showStatsOnLevelUp"),
    options: useOnOffOptions(),
  },
  {
    key: "candyUpgradeNotificationMode",
    label: t("settings:candyUpgradeNotification"),
    options: [
      { value: CandyUpgradeNotificationMode.OFF, label: t("settings:off") },
      { value: CandyUpgradeNotificationMode.PASSIVES_ONLY, label: t("settings:passivesOnly") },
      { value: CandyUpgradeNotificationMode.ON, label: t("settings:on") },
    ],
  },
  {
    key: "candyUpgradeDisplayMode",
    label: t("settings:candyUpgradeDisplay"),
    options: [
      { value: CandyUpgradeDisplayMode.ICON, label: t("settings:icon") },
      { value: CandyUpgradeDisplayMode.ANIMATION, label: t("settings:animation") },
    ],
    requiresReload: true,
  },
  {
    key: "enableMoveInfo",
    label: t("settings:moveInfo"),
    options: useOnOffOptions(),
  },
  {
    key: "showMovesetFlyout",
    label: t("settings:showMovesetFlyout"),
    options: useOnOffOptions(),
  },
  {
    key: "showArenaFlyout",
    label: t("settings:showArenaFlyout"),
    options: useOnOffOptions(),
  },
  {
    key: "showTimeOfDayWidget",
    label: t("settings:showTimeOfDayWidget"),
    options: useOnOffOptions(),
    requiresReload: true,
  },
  {
    key: "timeOfDayAnimation",
    label: t("settings:timeOfDayAnimation"),
    options: [
      { value: EaseType.BOUNCE, label: t("settings:bounce") },
      { value: EaseType.BACK, label: t("settings:timeOfDayBack") },
    ],
  },
  {
    key: "spriteSet",
    label: t("settings:spriteSet"),
    options: [
      {
        value: SpriteSet.CONSISTENT,
        label: t("settings:consistent"),
      },
      {
        value: SpriteSet.EXPERIMENTAL,
        label: t("settings:experimental"),
      },
    ],
    requiresReload: true,
  },
  {
    key: "enableFusionPaletteSwaps",
    label: t("settings:fusionPaletteSwaps"),
    options: useOnOffOptions(),
  },
  {
    key: "typeHintsMode",
    label: t("settings:typeHints"),
    options: [
      { value: TypeHints.OFF, label: t("settings:off") },
      { value: TypeHints.ON, label: t("settings:on") },
      { value: TypeHints.HIGH_CONTRAST, label: t("settings:highContrast") },
    ],
  },
  {
    key: "showBgmBar",
    label: t("settings:showBgmBar"),
    options: useOnOffOptions(),
  },
  {
    key: "hideUsername",
    label: t("settings:hideUsername"),
    options: useOnOffOptions(),
  },
  {
    key: "showMissingRibbons",
    label: t("settings:showMissingRibbons"),
    options: useOnOffOptions(),
  },
  {
    key: "shopCursorTarget",
    label: t("settings:shopCursorTarget"),
    options: [
      { value: ShopCursorTarget.REWARDS, label: t("settings:rewards") },
      { value: ShopCursorTarget.SHOP, label: t("settings:shop") },
      { value: ShopCursorTarget.REROLL, label: t("settings:reroll") },
      { value: ShopCursorTarget.CHECK_TEAM, label: t("settings:checkTeam") },
    ],
  },
  {
    key: "shopOverlayOpacity",
    label: t("settings:shopOverlayOpacity"),
    options: Array.from({ length: 9 }).map((_, i) => ({
      value: Number(((i + 1) * 0.1).toFixed(1)),
      label: `${(i + 1) * 10}`,
    })),
  },
];

// #endregion Display Settings

// #region Audio Settings

/** UI items for audio settings */
export const audioSettingsUiItems: SettingsUiItem<AudioSettingsKey>[] = [
  {
    key: "masterVolume",
    label: t("settings:masterVolume"),
    options: useVolumeOptions(),
    clamp: true,
  },
  {
    key: "bgmVolume",
    label: t("settings:bgmVolume"),
    options: useVolumeOptions(),
    clamp: true,
  },
  {
    key: "fieldVolume",
    label: t("settings:fieldVolume"),
    options: useVolumeOptions(),
    clamp: true,
  },
  {
    key: "soundEffectsVolume",
    label: t("settings:seVolume"),
    options: useVolumeOptions(),
    clamp: true,
  },
  {
    key: "uiVolume",
    label: t("settings:uiVolume"),
    options: useVolumeOptions(),
    clamp: true,
  },
  {
    key: "musicPreference",
    label: t("settings:battleMusic"),
    options: [
      { value: MusicPreference.GEN_FIVE, label: t("settings:musicGenFive") },
      { value: MusicPreference.ALL_GENS, label: t("settings:musicAllGens") },
    ],
    requiresReload: true,
  },
];

// #endregion Audio Settings
