import type { SettingsSaveMigrator } from "#types/save-migrators";

// #region Frozen Types

// These types are frozen copies of the types as they exist currently.
// This is done so later changes do not interfere with the migrators,
// which should be "frozen in time".

interface GeneralSettings {
  battleCursorMemory: boolean;
  battleStyle: 0 | 1;
  dexForDevs: boolean;
  eggSkipPreference: 0 | 1 | 2;
  enableRetries: boolean;
  enableTouchControls: boolean;
  enableTutorials: boolean;
  enableVibration: boolean;
  expGainsSpeed: 0 | 1 | 2 | 3;
  gameSpeed: 2 | 3 | 4 | 5;
  hideIvScanner: boolean;
  hpBarSpeed: 0 | 1 | 2 | 3;
  levelMoveConfirmation: boolean;
  manualMessageClear: boolean;
  partyExpNotificationMode: 0 | 1 | 2;
  playerGender: 0 | 1 | 2;
  preferBatonPass: boolean;
  skipSeenDialogues: boolean;
}

interface DisplaySettings {
  candyUpgradeDisplayMode: 0 | 1;
  candyUpgradeNotificationMode: 0 | 1 | 2;
  damageNumbersMode: 0 | 1 | 2;
  enableFusionPaletteSwaps: boolean;
  enableMoveAnimations: boolean;
  enableMoveInfo: boolean;
  hideUsername: boolean;
  language?: string;
  moneyFormat: 0 | 1;
  shopCursorTarget: ShopCursorTarget;
  shopOverlayOpacity: number;
  showArenaFlyout: boolean;
  showBgmBar: boolean;
  showMissingRibbons: boolean;
  showMovesetFlyout: boolean;
  showStatsOnLevelUp: boolean;
  showTimeOfDayWidget: boolean;
  spriteSet: 0 | 1;
  timeOfDayAnimation: EaseType;
  typeHintsMode: 0 | 1 | 2;
  uiTheme: 0 | 1;
  uiWindowStyle: 1 | 2 | 3 | 4 | 5;
}

interface AudioSettings {
  bgmVolume: number;
  fieldVolume: number;
  masterVolume: number;
  musicPreference: 0 | 1;
  soundEffectsVolume: number;
  uiVolume: number;
}

interface GamepadSettings {
  activeIndex: number;
  enabled: boolean;
}

/** All keys for the general settings + `"moveTouchControls"` */
type GeneralSettingsKey = keyof GeneralSettings | "moveTouchControls";

/** All keys for the display settings + `"language"` */
type DisplaySettingsKey = keyof DisplaySettings | "language";

/** All keys for the audio settings */
type AudioSettingsKey = keyof AudioSettings;

/** All keys for the gamepad settings */
type GamepadSettingsKey = keyof GamepadSettings;

// #endregion Frozen Types

// #region Frozen Enums

enum ShopCursorTarget {
  /** Cursor points to Reroll row */
  REROLL,
  /** Cursor points to Rewards row */
  REWARDS,
  /** Cursor points to Shop row */
  SHOP,
  /** Cursor points to Check Team row */
  CHECK_TEAM,
}

enum EaseType {
  NONE,
  LINEAR = "Linear",
  QUADRATIC = "Quad",
  CUBIC = "Cubic",
  QUARTIC = "Quart",
  QUINTIC = "Quint",
  SINUSOIDAL = "Sine",
  EXPONENTIAL = "Expo",
  CIRCULAR = "Circ",
  ELASTIC = "Elastic",
  BACK = "Back",
  BOUNCE = "Bounce",
  STEPPED = "Stepped",
}

// #endregion Frozen Enums

// #region Key migration

type OldKeys =
  | "BGM_VOLUME"
  | "BATTLE_MUSIC"
  | "BATTLE_STYLE"
  | "CANDY_UPGRADE_DISPLAY"
  | "CANDY_UPGRADE_NOTIFICATION"
  | "COMMAND_CURSOR_MEMORY"
  | "DAMAGE_NUMBERS"
  | "DEX_FOR_DEVS"
  | "EXP_GAINS_SPEED"
  | "EXP_PARTY_DISPLAY"
  | "EGG_SKIP"
  | "ENABLE_RETRIES"
  | "FIELD_VOLUME"
  | "FUSION_PALETTE_SWAPS"
  | "GAME_SPEED"
  | "HP_BAR_SPEED"
  | "HIDE_IVS"
  | "HIDE_MOVE_SKIP_CONFIRM"
  | "HIDE_USERNAME"
  | "gameVersion"
  | "LANGUAGE"
  | "MANUAL_MESSAGE_CLEAR"
  | "MASTER_VOLUME"
  | "MONEY_FORMAT"
  | "MOVE_ANIMATIONS"
  | "MOVE_INFO"
  | "PLAYER_GENDER"
  | "PREFER_BATON_PASS"
  | "SE_VOLUME"
  | "SHOP_CURSOR_TARGET"
  | "SHOP_OVERLAY_OPACITY"
  | "SHOW_ARENA_FLYOUT"
  | "SHOW_BGM_BAR"
  | "SHOW_MISSING_RIBBONS"
  | "SHOW_MOVESET_FLYOUT"
  | "SHOW_LEVEL_UP_STATS"
  | "SHOW_TIME_OF_DAY_WIDGET"
  | "SKIP_SEEN_DIALOGUES"
  | "SPRITE_SET"
  | "TIME_OF_DAY_ANIMATION"
  | "TOUCH_CONTROLS"
  | "TUTORIALS"
  | "TYPE_HINTS"
  | "UI_THEME"
  | "UI_SOUND_EFFECTS"
  | "VIBRATION"
  | "WINDOW_TYPE";

type Audio = { category: "audio"; newKey: AudioSettingsKey };
type Display = { category: "display"; newKey: DisplaySettingsKey };
type General = { category: "general"; newKey: GeneralSettingsKey };
type Meta = { category: "meta"; newKey: "gameVersion" };

type NewKeys = Audio | Display | General | Meta;

type KeyMigrationMap = Record<OldKeys, NewKeys>;

const keyMigrationMap: KeyMigrationMap = {
  BGM_VOLUME: { category: "audio", newKey: "bgmVolume" },
  BATTLE_MUSIC: { category: "audio", newKey: "musicPreference" },
  BATTLE_STYLE: { category: "general", newKey: "battleStyle" },
  CANDY_UPGRADE_DISPLAY: { category: "display", newKey: "candyUpgradeDisplayMode" },
  CANDY_UPGRADE_NOTIFICATION: { category: "display", newKey: "candyUpgradeNotificationMode" },
  COMMAND_CURSOR_MEMORY: { category: "general", newKey: "battleCursorMemory" },
  DAMAGE_NUMBERS: { category: "display", newKey: "damageNumbersMode" },
  DEX_FOR_DEVS: { category: "general", newKey: "dexForDevs" },
  EXP_GAINS_SPEED: { category: "general", newKey: "expGainsSpeed" },
  EXP_PARTY_DISPLAY: { category: "general", newKey: "partyExpNotificationMode" },
  EGG_SKIP: { category: "general", newKey: "eggSkipPreference" },
  ENABLE_RETRIES: { category: "general", newKey: "enableRetries" },
  FIELD_VOLUME: { category: "audio", newKey: "fieldVolume" },
  FUSION_PALETTE_SWAPS: { category: "display", newKey: "enableFusionPaletteSwaps" },
  GAME_SPEED: { category: "general", newKey: "gameSpeed" },
  gameVersion: { category: "meta", newKey: "gameVersion" },
  HP_BAR_SPEED: { category: "general", newKey: "hpBarSpeed" },
  HIDE_IVS: { category: "general", newKey: "hideIvScanner" },
  HIDE_MOVE_SKIP_CONFIRM: { category: "general", newKey: "levelMoveConfirmation" },
  HIDE_USERNAME: { category: "display", newKey: "hideUsername" },
  LANGUAGE: { category: "display", newKey: "language" },
  MANUAL_MESSAGE_CLEAR: { category: "general", newKey: "manualMessageClear" },
  MASTER_VOLUME: { category: "audio", newKey: "masterVolume" },
  MONEY_FORMAT: { category: "display", newKey: "moneyFormat" },
  MOVE_ANIMATIONS: { category: "display", newKey: "enableMoveAnimations" },
  MOVE_INFO: { category: "display", newKey: "enableMoveInfo" },
  PLAYER_GENDER: { category: "general", newKey: "playerGender" },
  PREFER_BATON_PASS: { category: "general", newKey: "preferBatonPass" },
  SE_VOLUME: { category: "audio", newKey: "soundEffectsVolume" },
  SHOP_CURSOR_TARGET: { category: "display", newKey: "shopCursorTarget" },
  SHOP_OVERLAY_OPACITY: { category: "display", newKey: "shopOverlayOpacity" },
  SHOW_ARENA_FLYOUT: { category: "display", newKey: "showArenaFlyout" },
  SHOW_BGM_BAR: { category: "display", newKey: "showBgmBar" },
  SHOW_MISSING_RIBBONS: { category: "display", newKey: "showMissingRibbons" },
  SHOW_MOVESET_FLYOUT: { category: "display", newKey: "showMovesetFlyout" },
  SHOW_LEVEL_UP_STATS: { category: "display", newKey: "showStatsOnLevelUp" },
  SHOW_TIME_OF_DAY_WIDGET: { category: "display", newKey: "showTimeOfDayWidget" },
  SKIP_SEEN_DIALOGUES: { category: "general", newKey: "skipSeenDialogues" },
  SPRITE_SET: { category: "display", newKey: "spriteSet" },
  TIME_OF_DAY_ANIMATION: { category: "display", newKey: "timeOfDayAnimation" },
  TOUCH_CONTROLS: { category: "general", newKey: "enableTouchControls" },
  TUTORIALS: { category: "general", newKey: "enableTutorials" },
  TYPE_HINTS: { category: "display", newKey: "typeHintsMode" },
  UI_THEME: { category: "display", newKey: "uiTheme" },
  UI_SOUND_EFFECTS: { category: "audio", newKey: "uiVolume" },
  VIBRATION: { category: "general", newKey: "enableVibration" },
  WINDOW_TYPE: { category: "display", newKey: "uiWindowStyle" },
};

/**
 * Move key to new location, then delete the old key.
 * @param data - The settings object
 * @param oldKey - The key to be migrated
 * @param category - The category to move the key to
 * @param newKey - The new name of the key
 */
function migrateKey(data: object, oldKey: string, category: string, newKey: string): void {
  if (Object.hasOwn(data, oldKey)) {
    data[category][newKey] = data[oldKey];
    data[oldKey] = undefined;
  }
}

/** Moves the settings keys in local storage to their new locations and deletes the old ones */
function migrateKeys(data: object): void {
  for (const category of ["audio", "display", "gamepad", "general", "meta"]) {
    data[category] ??= {};
  }

  for (const oldKey of Object.keys(keyMigrationMap)) {
    migrateKey(data, oldKey, keyMigrationMap[oldKey].category, keyMigrationMap[oldKey].newKey);
  }

  const lsGamepadSettings = localStorage.getItem("settingsGamepad");
  if (lsGamepadSettings != null) {
    const oldGamepadSettings = JSON.parse(lsGamepadSettings);

    if (Object.hasOwn(oldGamepadSettings, "CONTROLLER")) {
      data["gamepad"]["activeIndex"] = oldGamepadSettings["CONTROLLER"];
    }
    if (Object.hasOwn(oldGamepadSettings, "GAMEPAD_SUPPORT")) {
      data["gamepad"]["enabled"] = oldGamepadSettings["GAMEPAD_SUPPORT"];
    }

    localStorage.removeItem("settingsGamepad");
  }

  const landscapePositions = localStorage.getItem("touchControlPositionsLandscape");
  if (landscapePositions) {
    localStorage.setItem("touchControl/positions/landscape-primary", landscapePositions);
    localStorage.removeItem("touchControlPositionsLandscape");
  }

  const portraitPositions = localStorage.getItem("touchControlPositionsPortrait");
  if (portraitPositions) {
    localStorage.setItem("touchControl/positions/portrait-primary", portraitPositions);
    localStorage.removeItem("touchControlPositionsPortrait");
  }
}

// #endregion Key migration

// #region Value migration

/**
 * - "boolean": convert from `number` to `boolean` via `!!`
 * - "inverse": convert from `number` to `boolean` via `!`
 * - "other": modify value with custom function
 */
type ModificationType = "boolean" | "inverse" | "other";

type DisplayValuesMap = Record<"display", Partial<Record<DisplaySettingsKey, ModificationType>>>;
type GamepadValuesMap = Record<"gamepad", Partial<Record<GamepadSettingsKey, ModificationType>>>;
type GeneralValuesMap = Record<"general", Partial<Record<GeneralSettingsKey, ModificationType>>>;

type ValueMigrationMap = DisplayValuesMap | GamepadValuesMap | GeneralValuesMap;

const valueMigrationMap: ValueMigrationMap = {
  display: {
    enableFusionPaletteSwaps: "boolean",
    enableMoveAnimations: "boolean",
    enableMoveInfo: "boolean",
    hideUsername: "boolean",
    shopCursorTarget: "other",
    shopOverlayOpacity: "other",
    showArenaFlyout: "boolean",
    showBgmBar: "boolean",
    showMissingRibbons: "boolean",
    showMovesetFlyout: "boolean",
    showStatsOnLevelUp: "boolean",
    showTimeOfDayWidget: "boolean",
    timeOfDayAnimation: "other",
    uiWindowStyle: "other",
  },
  gamepad: {
    enabled: "boolean",
  },
  general: {
    battleCursorMemory: "boolean",
    dexForDevs: "boolean",
    enableRetries: "boolean",
    enableTouchControls: "inverse",
    enableTutorials: "boolean",
    enableVibration: "inverse",
    gameSpeed: "other",
    hideIvScanner: "boolean",
    levelMoveConfirmation: "boolean",
    manualMessageClear: "boolean",
    playerGender: "other",
    preferBatonPass: "boolean",
    skipSeenDialogues: "boolean",
  },
};

/** Converts values to their new representations. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: necessary
function migrateValues(data: object): void {
  for (const category of Object.keys(valueMigrationMap)) {
    for (const key of Object.keys(data[category])) {
      if (!(key in valueMigrationMap[category])) {
        continue;
      }

      if (valueMigrationMap[category][key] === "boolean") {
        data[category][key] = !!data[category][key];
        continue;
      }

      if (valueMigrationMap[category][key] === "inverse") {
        data[category][key] = !data[category][key];
        continue;
      }

      if (key === "gameSpeed") {
        data[category][key] += 2;
        continue;
      }

      if (key === "playerGender") {
        data[category][key] += 1;
        continue;
      }

      if (key === "shopCursorTarget") {
        const valueMap = {
          [0]: ShopCursorTarget.REWARDS,
          [1]: ShopCursorTarget.SHOP,
          [2]: ShopCursorTarget.REROLL,
          [3]: ShopCursorTarget.CHECK_TEAM,
        } as const;
        data[category][key] = valueMap[data[category][key]];
        continue;
      }

      if (key === "shopOverlayOpacity") {
        const value = (data[category][key] + 1) * 0.1;
        data[category][key] = Number(value.toFixed(1));
        continue;
      }

      if (key === "timeOfDayAnimation") {
        const valueMap = { [0]: EaseType.BOUNCE, [1]: EaseType.BACK } as const;
        data[category][key] = valueMap[data[category][key]];
        continue;
      }

      if (key === "uiWindowStyle") {
        data[category][key] += 1;
      }
    }
  }

  for (const key of Object.keys(data["audio"])) {
    if (key === "musicPreference") {
      continue;
    }
    const value = data["audio"][key] * 0.1;
    data["audio"][key] = Number(value.toFixed(1));
  }
}

// #endregion Value migration

// #region Migrators

const migrateSettings: SettingsSaveMigrator = {
  name: "migrateSettings",
  version: "1.12.1.0",
  migrate: (data: object): void => {
    migrateKeys(data);
    migrateValues(data);
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [migrateSettings] as const;

// #endregion Migrators
