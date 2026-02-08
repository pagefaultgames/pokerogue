import type { BattlerIndex } from "#enums/battler-index";
import type { TextStyle } from "#enums/text-style";
import type { PlayerPokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import type { PokemonMove } from "#moves/pokemon-move";
import type { Starter } from "#types/save-data";

export interface ModalConfig {
  buttonActions: ((...args: any[]) => any)[];
}

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export interface OptionSelectConfig {
  xOffset?: number;
  yOffset?: number;
  options: OptionSelectItem[];
  maxOptions?: number;
  delay?: number;
  noCancel?: boolean;
  supportHover?: boolean;
}

export interface OptionSelectItem {
  label: string;
  handler: () => boolean;
  onHover?: () => void;
  skip?: boolean;
  keepOpen?: boolean;
  overrideSound?: boolean;
  style?: TextStyle;
  item?: string;
  itemArgs?: any[];
}

export type TargetSelectCallback = (targets: BattlerIndex[]) => void;

export enum SaveSlotUiMode {
  LOAD,
  SAVE,
}

export type SaveSlotSelectCallback = (cursor: number) => void;

export type StarterSelectCallback = (starters: Starter[]) => void;

export enum SummaryUiMode {
  DEFAULT,
  LEARN_MOVE,
}

export enum SummaryPage {
  PROFILE,
  STATS,
  MOVES,
}

/**
 * Indicates the reason why the party UI is being opened.
 */
export enum PartyUiMode {
  /**
   * Indicates that the party UI is open because of a user-opted switch.  This
   * type of switch can be cancelled.
   */
  SWITCH,
  /**
   * Indicates that the party UI is open because of a faint or other forced
   * switch (eg, move effect). This type of switch cannot be cancelled.
   */
  FAINT_SWITCH,
  /**
   * Indicates that the party UI is open because of a start-of-encounter optional
   * switch. This type of switch can be cancelled.
   */
  // TODO: Rename to PRE_BATTLE_SWITCH
  POST_BATTLE_SWITCH,
  /**
   * Indicates that the party UI is open because of the move Revival Blessing.
   * This selection cannot be cancelled.
   */
  REVIVAL_BLESSING,
  /**
   * Indicates that the party UI is open to select a mon to apply a modifier to.
   * This type of selection can be cancelled.
   */
  MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to apply a move
   * modifier to (such as an Ether or PP Up).  This type of selection can be cancelled.
   */
  MOVE_MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to teach a TM.  This
   * type of selection can be cancelled.
   */
  TM_MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to remember a move.
   * This type of selection can be cancelled.
   */
  REMEMBER_MOVE_MODIFIER,
  /**
   * Indicates that the party UI is open to transfer items between mons.  This
   * type of selection can be cancelled.
   */
  MODIFIER_TRANSFER,
  /**
   * Indicates that the party UI is open because of a DNA Splicer.  This
   * type of selection can be cancelled.
   */
  SPLICE,
  /**
   * Indicates that the party UI is open to release a party member.  This
   * type of selection can be cancelled.
   */
  RELEASE,
  /**
   * Indicates that the party UI is open to check the team.  This
   * type of selection can be cancelled.
   */
  CHECK,
  /**
   * Indicates that the party UI is open to select a party member for an arbitrary effect.
   * This is generally used in for Mystery Encounter or special effects that require the player to select a Pokemon
   */
  SELECT,
  /**
   * Indicates that the party UI is open to select a party member from which items will be discarded.
   * This type of selection can be cancelled.
   */
  DISCARD,
}

export enum PartyOption {
  CANCEL = -1,
  SEND_OUT,
  PASS_BATON,
  REVIVE,
  APPLY,
  TEACH,
  TRANSFER,
  SUMMARY,
  POKEDEX,
  UNPAUSE_EVOLUTION,
  SPLICE,
  UNSPLICE,
  RELEASE,
  RENAME,
  SELECT,
  DISCARD,
  SCROLL_UP = 1000,
  SCROLL_DOWN = 1001,
  FORM_CHANGE_ITEM = 2000,
  MOVE_1 = 3000,
  MOVE_2,
  MOVE_3,
  MOVE_4,
  ALL = 4000,
}

export type PartySelectCallback = (cursor: number, option: PartyOption) => void;
export type PartyModifierTransferSelectCallback = (
  fromCursor: number,
  index: number,
  itemQuantity?: number,
  toCursor?: number,
) => void;
export type PartyModifierSpliceSelectCallback = (fromCursor: number, toCursor?: number) => void;
export type PokemonSelectFilter = (pokemon: PlayerPokemon) => string | null;
export type PokemonModifierTransferSelectFilter = (
  pokemon: PlayerPokemon,
  modifier: PokemonHeldItemModifier,
) => string | null;
export type PokemonMoveSelectFilter = (pokemonMove: PokemonMove) => string | null;

export enum RunDisplayMode {
  RUN_HISTORY,
  SESSION_PREVIEW,
}

export type CancelFn = (success?: boolean) => boolean;
