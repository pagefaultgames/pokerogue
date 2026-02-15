import { UiMode } from "#enums/ui-mode";
import type { AchvsUiHandler } from "#ui/achvs-ui-handler";
import type { AdminUiHandler } from "#ui/admin-ui-handler";
import type { AutoCompleteUiHandler } from "#ui/autocomplete-ui-handler";
import type { BallUiHandler } from "#ui/ball-ui-handler";
import type { BattleMessageUiHandler } from "#ui/battle-message-ui-handler";
import type { GameChallengesUiHandler } from "#ui/challenges-select-ui-handler";
import type { ChangePasswordFormUiHandler } from "#ui/change-password-form-ui-handler";
import type { CommandUiHandler } from "#ui/command-ui-handler";
import type { ConfirmUiHandler } from "#ui/confirm-ui-handler";
import type { EggGachaUiHandler } from "#ui/egg-gacha-ui-handler";
import type { EggHatchSceneUiHandler } from "#ui/egg-hatch-scene-ui-handler";
import type { EggListUiHandler } from "#ui/egg-list-ui-handler";
import type { EggSummaryUiHandler } from "#ui/egg-summary-ui-handler";
import type { EvolutionSceneUiHandler } from "#ui/evolution-scene-ui-handler";
import type { FightUiHandler } from "#ui/fight-ui-handler";
import type { GameStatsUiHandler } from "#ui/game-stats-ui-handler";
import type { GamepadBindingUiHandler } from "#ui/gamepad-binding-ui-handler";
import type { KeyboardBindingUiHandler } from "#ui/keyboard-binding-ui-handler";
import type { LoadingModalUiHandler } from "#ui/loading-modal-ui-handler";
import type { LoginFormUiHandler } from "#ui/login-form-ui-handler";
import type { LoginOrRegisterUiHandler } from "#ui/login-or-register-ui-handler";
import type { MenuUiHandler } from "#ui/menu-ui-handler";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import type { MysteryEncounterUiHandler } from "#ui/mystery-encounter-ui-handler";
import type { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import type { PokedexPageUiHandler } from "#ui/pokedex-page-ui-handler";
import type { PokedexScanUiHandler } from "#ui/pokedex-scan-ui-handler";
import type { PokedexUiHandler } from "#ui/pokedex-ui-handler";
import type { RegistrationFormUiHandler } from "#ui/registration-form-ui-handler";
import type { RenameFormUiHandler } from "#ui/rename-form-ui-handler";
import type { RenameRunFormUiHandler } from "#ui/rename-run-ui-handler";
import type { RunHistoryUiHandler } from "#ui/run-history-ui-handler";
import type { RunInfoUiHandler } from "#ui/run-info-ui-handler";
import type { SaveSlotSelectUiHandler } from "#ui/save-slot-select-ui-handler";
import type { SessionReloadModalUiHandler } from "#ui/session-reload-modal-ui-handler";
import type { SettingsAudioUiHandler } from "#ui/settings-audio-ui-handler";
import type { SettingsDisplayUiHandler } from "#ui/settings-display-ui-handler";
import type { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import type { SettingsKeyboardUiHandler } from "#ui/settings-keyboard-ui-handler";
import type { SettingsUiHandler } from "#ui/settings-ui-handler";
import type { StarterSelectUiHandler } from "#ui/starter-select-ui-handler";
import type { SummaryUiHandler } from "#ui/summary-ui-handler";
import type { TargetSelectUiHandler } from "#ui/target-select-ui-handler";
import type { TestDialogueUiHandler } from "#ui/test-dialogue-ui-handler";
import type { TitleUiHandler } from "#ui/title-ui-handler";
import type { UnavailableModalUiHandler } from "#ui/unavailable-modal-ui-handler";

type ModeToUiHandlerMap = {
  [UiMode.MESSAGE]: BattleMessageUiHandler;
  [UiMode.TITLE]: TitleUiHandler;
  [UiMode.COMMAND]: CommandUiHandler;
  [UiMode.FIGHT]: FightUiHandler;
  [UiMode.BALL]: BallUiHandler;
  [UiMode.TARGET_SELECT]: TargetSelectUiHandler;
  [UiMode.MODIFIER_SELECT]: ModifierSelectUiHandler;
  [UiMode.SAVE_SLOT]: SaveSlotSelectUiHandler;
  [UiMode.PARTY]: PartyUiHandler;
  [UiMode.SUMMARY]: SummaryUiHandler;
  [UiMode.STARTER_SELECT]: StarterSelectUiHandler;
  [UiMode.EVOLUTION_SCENE]: EvolutionSceneUiHandler;
  [UiMode.EGG_HATCH_SCENE]: EggHatchSceneUiHandler;
  [UiMode.EGG_HATCH_SUMMARY]: EggSummaryUiHandler;
  [UiMode.CONFIRM]: ConfirmUiHandler;
  [UiMode.OPTION_SELECT]: OptionSelectUiHandler;
  [UiMode.MENU]: MenuUiHandler;
  [UiMode.MENU_OPTION_SELECT]: OptionSelectUiHandler;

  // settings
  [UiMode.SETTINGS]: SettingsUiHandler;
  [UiMode.SETTINGS_DISPLAY]: SettingsDisplayUiHandler;
  [UiMode.SETTINGS_AUDIO]: SettingsAudioUiHandler;
  [UiMode.SETTINGS_GAMEPAD]: SettingsGamepadUiHandler;
  [UiMode.GAMEPAD_BINDING]: GamepadBindingUiHandler;
  [UiMode.SETTINGS_KEYBOARD]: SettingsKeyboardUiHandler;
  [UiMode.KEYBOARD_BINDING]: KeyboardBindingUiHandler;

  [UiMode.ACHIEVEMENTS]: AchvsUiHandler;
  [UiMode.GAME_STATS]: GameStatsUiHandler;
  [UiMode.EGG_LIST]: EggListUiHandler;
  [UiMode.EGG_GACHA]: EggGachaUiHandler;
  [UiMode.POKEDEX]: PokedexUiHandler;
  [UiMode.POKEDEX_SCAN]: PokedexScanUiHandler;
  [UiMode.POKEDEX_PAGE]: PokedexPageUiHandler;

  [UiMode.LOGIN_OR_REGISTER]: LoginOrRegisterUiHandler;
  [UiMode.LOGIN_FORM]: LoginFormUiHandler;
  [UiMode.REGISTRATION_FORM]: RegistrationFormUiHandler;

  [UiMode.LOADING]: LoadingModalUiHandler;
  [UiMode.SESSION_RELOAD]: SessionReloadModalUiHandler;
  [UiMode.UNAVAILABLE]: UnavailableModalUiHandler;

  [UiMode.CHALLENGE_SELECT]: GameChallengesUiHandler;
  [UiMode.RENAME_POKEMON]: RenameFormUiHandler;
  [UiMode.RENAME_RUN]: RenameRunFormUiHandler;
  [UiMode.RUN_HISTORY]: RunHistoryUiHandler;
  [UiMode.RUN_INFO]: RunInfoUiHandler;

  [UiMode.TEST_DIALOGUE]: TestDialogueUiHandler;
  [UiMode.AUTO_COMPLETE]: AutoCompleteUiHandler;
  [UiMode.ADMIN]: AdminUiHandler;
  [UiMode.MYSTERY_ENCOUNTER]: MysteryEncounterUiHandler;
  [UiMode.CHANGE_PASSWORD_FORM]: ChangePasswordFormUiHandler;
};

export type HandlerOf<M extends UiMode> = ModeToUiHandlerMap[M];
