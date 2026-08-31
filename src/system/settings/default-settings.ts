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
import { UiWindowStyle } from "#enums/ui-window-style";
import type {
  AudioSettings,
  DisplaySettings,
  GamepadSettings,
  GeneralSettings,
  UserFacingSettings,
} from "#types/settings";

const defaultGeneralSettings: GeneralSettings = {
  battleCursorMemory: false,
  battleStyle: BattleStyle.SWITCH,
  dexForDevs: false,
  eggSkipPreference: EggSkipPreference.ASK,
  enableRetries: false,
  enableTouchControls: true, // auto
  enableTutorials: import.meta.env.VITE_BYPASS_TUTORIAL !== "1",
  enableVibration: false,
  expGainsSpeed: ExpGainsSpeed.DEFAULT,
  gameSpeed: GameSpeed.NORMAL,
  hideIvScanner: false,
  hpBarSpeed: HpBarSpeed.DEFAULT,
  levelMoveConfirmation: true,
  manualMessageClear: false,
  partyExpNotificationMode: ExpNotification.DEFAULT,
  playerGender: PlayerGender.UNSET,
  preferBatonPass: false,
  skipSeenDialogues: false,
};

const defaultDisplaySettings: DisplaySettings = {
  candyUpgradeDisplayMode: CandyUpgradeDisplayMode.ICON,
  candyUpgradeNotificationMode: CandyUpgradeNotificationMode.ON,
  damageNumbersMode: DamageNumbersMode.FANCY,
  enableFusionPaletteSwaps: true,
  enableMoveAnimations: true,
  enableMoveInfo: true,
  hideUsername: false,
  moneyFormat: MoneyFormat.NORMAL,
  shopCursorTarget: ShopCursorTarget.REWARDS,
  shopOverlayOpacity: 0.8,
  showArenaFlyout: true,
  showBgmBar: true,
  showMissingRibbons: false,
  showMovesetFlyout: true,
  showStatsOnLevelUp: true,
  showTimeOfDayWidget: true,
  spriteSet: SpriteSet.CONSISTENT,
  timeOfDayAnimation: EaseType.BOUNCE,
  typeHintsMode: TypeHints.ON,
  uiTheme: UiTheme.DEFAULT,
  uiWindowStyle: UiWindowStyle.RED_ORANGE,
};

const defaultAudioSettings: AudioSettings = {
  bgmVolume: 0.5,
  fieldVolume: 0.5,
  masterVolume: 0.3,
  musicPreference: MusicPreference.ALL_GENS,
  soundEffectsVolume: 0.5,
  uiVolume: 0.5,
};

const defaultGamepadSettings: GamepadSettings = {
  activeIndex: 0,
  enabled: true,
};

export const defaultSettings: UserFacingSettings = {
  audio: defaultAudioSettings,
  display: defaultDisplaySettings,
  gamepad: defaultGamepadSettings,
  general: defaultGeneralSettings,
};
