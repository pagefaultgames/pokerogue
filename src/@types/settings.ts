import type { BattleStyle } from "#enums/battle-style";
import type { CandyUpgradeDisplayMode } from "#enums/candy-upgrade-display-mode";
import type { CandyUpgradeNotificationMode } from "#enums/candy-upgrade-notification-mode";
import type { DamageNumbersMode } from "#enums/damage-numbers-mode";
import type { EaseType } from "#enums/ease-type";
import type { EggSkipPreference } from "#enums/egg-skip-preference";
import type { ExpGainsSpeed } from "#enums/exp-gains-speed";
import type { ExpNotification } from "#enums/exp-notification";
import type { GameSpeed } from "#enums/game-speed";
import type { HpBarSpeed } from "#enums/hp-bar-speed";
import type { MoneyFormat } from "#enums/money-format";
import type { MusicPreference } from "#enums/music-preference";
import type { PlayerGender } from "#enums/player-gender";
import type { ShopCursorTarget } from "#enums/shop-cursor-target";
import type { SpriteSet } from "#enums/sprite-set";
import type { TypeHints } from "#enums/type-hints";
import type { UiTheme } from "#enums/ui-theme";
import type { UiWindowStyle } from "#enums/ui-window-style";

interface MetaSettings {
  gameVersion: string;
}

export interface Settings extends UserFacingSettings {
  meta: MetaSettings;
}

export interface UserFacingSettings {
  audio: AudioSettings;
  display: DisplaySettings;
  gamepad: GamepadSettings;
  general: GeneralSettings;
}

export interface GeneralSettings {
  battleCursorMemory: boolean;
  battleStyle: BattleStyle;
  dexForDevs: boolean;
  eggSkipPreference: EggSkipPreference;
  enableRetries: boolean;
  enableTouchControls: boolean;
  enableTutorials: boolean;
  enableVibration: boolean;
  expGainsSpeed: ExpGainsSpeed;
  gameSpeed: GameSpeed;
  hideIvScanner: boolean;
  hpBarSpeed: HpBarSpeed;
  levelMoveConfirmation: boolean;
  manualMessageClear: boolean;
  partyExpNotificationMode: ExpNotification;
  playerGender: PlayerGender;
  preferBatonPass: boolean;
  skipSeenDialogues: boolean;
}

export interface DisplaySettings {
  candyUpgradeDisplayMode: CandyUpgradeDisplayMode;
  candyUpgradeNotificationMode: CandyUpgradeNotificationMode;
  damageNumbersMode: DamageNumbersMode;
  enableFusionPaletteSwaps: boolean;
  enableMoveAnimations: boolean;
  enableMoveInfo: boolean;
  hideUsername: boolean;
  language?: string;
  moneyFormat: MoneyFormat;
  shopCursorTarget: ShopCursorTarget;
  shopOverlayOpacity: number;
  showArenaFlyout: boolean;
  showBgmBar: boolean;
  showMissingRibbons: boolean;
  showMovesetFlyout: boolean;
  showStatsOnLevelUp: boolean;
  showTimeOfDayWidget: boolean;
  spriteSet: SpriteSet;
  timeOfDayAnimation: EaseType;
  typeHintsMode: TypeHints;
  uiTheme: UiTheme;
  uiWindowStyle: UiWindowStyle;
}

export interface AudioSettings {
  bgmVolume: number;
  fieldVolume: number;
  masterVolume: number;
  musicPreference: MusicPreference;
  soundEffectsVolume: number;
  uiVolume: number;
}

export interface GamepadSettings {
  activeIndex: number;
  enabled: boolean;
}

export type SettingUiItemOption = {
  value: number | string | boolean;
  label: string;
  /** Indicates if a settings change requires a confirmation */
  requiresConfirmation?: boolean;
  /** Provide a custom confirmation message. */
  confirmationMessage?: string;
};

export interface SettingsUiItem<K = AnySettingKey> {
  key: K;
  label: string;
  options: SettingUiItemOption[];
  /** Indicates if a settings change requires a reload */
  requiresReload?: boolean;
  /** Whether the setting is only available on devices supporting touchscreen. */
  touchscreenOnly?: boolean;
  /**
   * Specifies the behavior when navigating left/right at the boundaries of the option:
   *
   * - `true`: the cursor will stay on the boundary instead of moving
   * - `false`: the cursor will wrap to the other end of the options list
   * @defaultValue `false`
   */
  clamp?: boolean;
}

export type SettingsCategory = keyof UserFacingSettings;

/** All keys for all settings categories */
export type AnySettingKey = GeneralSettingsKey | DisplaySettingsKey | AudioSettingsKey | GamepadSettingsKey;

/** All keys for the general settings + `"moveTouchControls"` */
export type GeneralSettingsKey = keyof GeneralSettings | "moveTouchControls";

/** All keys for the display settings + `"language"` */
export type DisplaySettingsKey = keyof DisplaySettings | "language";

/** All keys for the audio settings */
export type AudioSettingsKey = keyof AudioSettings;

/** All keys for changing the volume settings */
export type VolumeSettingsKey = Exclude<AudioSettingsKey, "musicPreference">;

/** All keys for the gamepad settings */
export type GamepadSettingsKey = keyof GamepadSettings;
