import type { EggHatchData } from "#data/egg-hatch-data";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { AdminMode } from "#enums/admin-mode";
import type { BattlerIndex } from "#enums/battler-index";
import type { Command } from "#enums/command";
import type { MoveId } from "#enums/move-id";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import type { OptionSelectSettings } from "#mystery-encounters/encounter-phase-utils";
import type { ModifierSelectCallback } from "#phases/select-modifier-phase";
import type { GameData } from "#system/game-data";
import type { SearchAccountResponse } from "#types/api";
import type { Move } from "#types/move-types";
import type { RunEntry, SessionSaveData, StarterAttributes } from "#types/save-data";
import type {
  CancelFn,
  OptionSelectItem,
  PartyModifierTransferSelectCallback,
  PartySelectCallback,
  PartyUiMode,
  PokemonModifierTransferSelectFilter,
  PokemonMoveSelectFilter,
  PokemonSelectFilter,
  RunDisplayMode,
  SaveSlotSelectCallback,
  SaveSlotUiMode,
  StarterSelectCallback,
  SummaryPage,
  SummaryUiMode,
  TargetSelectCallback,
} from "#ui/ui-types";

export type NoParams = Record<string, never>;

// This is the same as OptionSelectConfig
export interface OptionSelectUiHandlerParams {
  xOffset?: number;
  yOffset?: number;
  options?: OptionSelectItem[];
  maxOptions?: number;
  delay?: number;
  noCancel?: boolean;
  supportHover?: boolean;
}

// TODO: Generalize this to any number of extra options and functions
export interface ConfirmUiHandlerParams extends OptionSelectUiHandlerParams {
  onYes: () => void;
  onNo: () => void;
  onSummary?: () => void;
  onPokedex?: () => void;
  switchCheck?: boolean;
  xOffset?: number;
  yOffset?: number;
  delay?: number;
  noCancel?: boolean;
}

export interface CommandUiHandlerParams {
  fieldIndex?: number;
}

export interface FightUiHandlerParams {
  fieldIndex?: number;
  command?: Command;
}

export interface TargetSelectUiHandlerParams {
  fieldIndex: number;
  moveId: MoveId;
  targetSelectCallback: TargetSelectCallback;
  defaultTargets?: BattlerIndex[] | undefined;
}

export interface ModifierSelectUiHandlerParams {
  player?: boolean;
  typeOptions?: ModifierTypeOption[];
  onActionInput?: ModifierSelectCallback;
  rerollCost?: number;
}

export interface SaveSlotSelectUiHandlerParams {
  uiMode: SaveSlotUiMode;
  saveSlotSelectCallback: SaveSlotSelectCallback;
}

export interface PartyUiHandlerParams {
  partyUiMode?: PartyUiMode;
  fieldIndex?: number;
  selectCallback?: PartySelectCallback;
  selectFilter?: PokemonSelectFilter | undefined;
  itemSelectCallback?: PartyModifierTransferSelectCallback | undefined;
  itemSelectFilter?: PokemonModifierTransferSelectFilter | undefined;
  moveSelectFilter?: PokemonMoveSelectFilter | undefined;
  tmMoveId?: MoveId | undefined;
  showMovePp?: boolean;
}

export interface SummaryUiHandlerParamsDefault {
  uiMode: SummaryUiMode.DEFAULT;
  pokemon: PlayerPokemon;
  startPage?: SummaryPage;
  selectCallback?: (cursor: number) => void;
  player?: boolean;
  fromSummary?: boolean;
}

export interface SummaryUiHandlerParamsLearnMove {
  uiMode: SummaryUiMode.LEARN_MOVE;
  pokemon: PlayerPokemon;
  move: Move;
  selectCallback?: (cursor: number) => void;
  player?: boolean;
  fromSummary?: boolean;
}

export type SummaryUiHandlerParams = SummaryUiHandlerParamsDefault | SummaryUiHandlerParamsLearnMove;

export interface StarterSelectUiHandlerParams {
  starterSelectCallback?: StarterSelectCallback;
}

export interface PokedexUiHandlerParams {
  refresh?: boolean;
  gameData?: GameData;
  exitCallback?: () => void;
}

export interface PokedexPageUiHandlerParams {
  refresh?: boolean;
  species?: PokemonSpecies | undefined;
  savedStarterAttributes?: StarterAttributes | undefined;
  filteredIndices?: SpeciesId[] | undefined;
  exitCallback?: () => void;
}

export interface EggSummaryUiHandlerParams {
  eggHatchData: EggHatchData[];
}

export interface AutoCompleteUiHandlerParams extends OptionSelectUiHandlerParams {
  modalContainer: Phaser.GameObjects.Container;
}

//TODO: These are very similar to ModalConfig, figure it out
export interface ModalUiHandlerParams {
  buttonActions: ((...args: any[]) => any)[];
  fadeOut?: () => void;
}

export interface UnavailableModalUiHandlerParams extends ModalUiHandlerParams {
  reconnectCallback: () => void;
}

export interface FormModalUiHandlerParams extends ModalUiHandlerParams {
  errorMessage?: string;
}

export interface RunInfoUiHandlerParamsHistory {
  runDisplayMode: RunDisplayMode.RUN_HISTORY;
  runEntry: RunEntry;
  runInfo?: never;
}

export interface RunInfoUiHandlerParamsPreview {
  runDisplayMode: RunDisplayMode.SESSION_PREVIEW;
  runEntry?: never;
  runInfo: SessionSaveData;
}

export type RunInfoUiHandlerParams = RunInfoUiHandlerParamsHistory | RunInfoUiHandlerParamsPreview;

export interface TestDialogueUiHandlerParams extends FormModalUiHandlerParams {
  pokemon?: PlayerPokemon;
  text?: string;
}

export interface PokedexScanUiHandlerParams extends TestDialogueUiHandlerParams {
  row: number;
}

export interface AdminUiHandlerParams extends FormModalUiHandlerParams {
  adminMode: AdminMode;
  adminResult?: SearchAccountResponse;
  isMessageError?: boolean;
}

export interface GameStatsUiHandlerParams {
  username?: string;
  data?: GameData;
  callback?: () => void;
}

export interface MysteryEncounterUiHandlerParams {
  settings?: OptionSelectSettings | undefined;
}

export interface BindingUiHandlerParams {
  cancelHandler: CancelFn;
  target: any;
}

export type UiHandlerParamMap = {
  [UiMode.MESSAGE]: NoParams;
  [UiMode.TITLE]: OptionSelectUiHandlerParams;
  [UiMode.COMMAND]: CommandUiHandlerParams;
  [UiMode.FIGHT]: FightUiHandlerParams;
  [UiMode.BALL]: NoParams;
  [UiMode.TARGET_SELECT]: TargetSelectUiHandlerParams;
  [UiMode.MODIFIER_SELECT]: ModifierSelectUiHandlerParams;
  [UiMode.SAVE_SLOT]: SaveSlotSelectUiHandlerParams;
  [UiMode.PARTY]: PartyUiHandlerParams;
  [UiMode.SUMMARY]: SummaryUiHandlerParams;
  [UiMode.STARTER_SELECT]: StarterSelectUiHandlerParams;
  [UiMode.EVOLUTION_SCENE]: NoParams;
  [UiMode.EGG_HATCH_SCENE]: NoParams;
  [UiMode.EGG_HATCH_SUMMARY]: EggSummaryUiHandlerParams;
  [UiMode.CONFIRM]: ConfirmUiHandlerParams;
  [UiMode.OPTION_SELECT]: OptionSelectUiHandlerParams;
  [UiMode.MENU]: NoParams;
  [UiMode.MENU_OPTION_SELECT]: OptionSelectUiHandlerParams;
  [UiMode.SETTINGS]: NoParams;
  [UiMode.SETTINGS_DISPLAY]: NoParams;
  [UiMode.SETTINGS_AUDIO]: NoParams;
  [UiMode.SETTINGS_GAMEPAD]: NoParams;
  [UiMode.GAMEPAD_BINDING]: BindingUiHandlerParams;
  [UiMode.SETTINGS_KEYBOARD]: NoParams;
  [UiMode.KEYBOARD_BINDING]: BindingUiHandlerParams;
  [UiMode.ACHIEVEMENTS]: NoParams;
  [UiMode.GAME_STATS]: GameStatsUiHandlerParams;
  [UiMode.EGG_LIST]: NoParams;
  [UiMode.EGG_GACHA]: NoParams;
  [UiMode.POKEDEX]: PokedexUiHandlerParams;
  [UiMode.POKEDEX_SCAN]: PokedexScanUiHandlerParams;
  [UiMode.POKEDEX_PAGE]: PokedexPageUiHandlerParams;
  [UiMode.LOGIN_OR_REGISTER]: FormModalUiHandlerParams;
  [UiMode.LOGIN_FORM]: ModalUiHandlerParams;
  [UiMode.REGISTRATION_FORM]: FormModalUiHandlerParams;
  [UiMode.LOADING]: ModalUiHandlerParams;
  [UiMode.SESSION_RELOAD]: ModalUiHandlerParams;
  [UiMode.UNAVAILABLE]: UnavailableModalUiHandlerParams;
  [UiMode.CHALLENGE_SELECT]: NoParams;
  [UiMode.RENAME_POKEMON]: TestDialogueUiHandlerParams;
  [UiMode.RENAME_RUN]: FormModalUiHandlerParams;
  [UiMode.RUN_HISTORY]: NoParams;
  [UiMode.RUN_INFO]: RunInfoUiHandlerParams;
  [UiMode.TEST_DIALOGUE]: TestDialogueUiHandlerParams;
  [UiMode.AUTO_COMPLETE]: AutoCompleteUiHandlerParams;
  [UiMode.ADMIN]: AdminUiHandlerParams;
  [UiMode.MYSTERY_ENCOUNTER]: MysteryEncounterUiHandlerParams;
  [UiMode.CHANGE_PASSWORD_FORM]: FormModalUiHandlerParams;
};
