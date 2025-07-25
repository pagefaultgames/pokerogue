// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { PokemonSummonData } from "#data/pokemon-data";
import type { PokemonMove } from "#moves/pokemon-move";

/** Enum comprising all {@linkcode BattleScene} events that can be emitted. */
export enum BattleSceneEventType {
  /**
   * Emitted when the corresponding setting is changed
   * @see {@linkcode CandyUpgradeNotificationChangedEvent}
   */
  CANDY_UPGRADE_NOTIFICATION_CHANGED = "onCandyUpgradeNotificationChanged",

  /**
   * Emitted whenever a Pokemon's moveset is changed or altered - whether from moveset-overridding effects,
   * PP consumption or restoration.
   * @see {@linkcode MovesetChangedEvent}
   */
  MOVESET_CHANGED = "onMovesetChanged",

  /**
   * Emitted whenever the {@linkcode PokemonSummonData} of any {@linkcode Pokemon} is reset to its initial state
   * (such as immediately before a switch-out).
   * @see {@linkcode SummonDataResetEvent}
   */
  SUMMON_DATA_RESET = "onSummonDataReset",

  /**
   * Emitted at the start of each new encounter
   * @see {@linkcode EncounterPhaseEvent}
   */
  ENCOUNTER_PHASE = "onEncounterPhase",
  /**
   * Emitted after a turn ends in battle
   * @see {@linkcode TurnEndEvent}
   */
  TURN_END = "onTurnEnd",

  /**
   * Emitted when a new {@linkcode Arena} is created during initialization
   * @see {@linkcode NewArenaEvent}
   */
  NEW_ARENA = "onNewArena",
}

/**
 * Abstract container class for all {@linkcode BattleSceneEventType} events.
 */
abstract class BattleSceneEvent extends Event {
  public declare abstract readonly type: BattleSceneEventType; // that's a mouthful!
  // biome-ignore lint/complexity/noUselessConstructor: changes the type of the type field
  constructor(type: BattleSceneEventType) {
    super(type);
  }
}

export type { BattleSceneEvent };

/**
 * Container class for {@linkcode BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED} events
 */
export class CandyUpgradeNotificationChangedEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED;
  /** The new value the setting was changed to */
  public newValue: number;
  constructor(newValue: number) {
    super(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED);

    this.newValue = newValue;
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.MOVESET_CHANGED} events. \
 * Emitted whenever the moveset of any {@linkcode Pokemon} is changed, or a move's PP is increased or decreased.
 */
export class MovesetChangedEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.MOVESET_CHANGED;

  /** The {@linkcode Pokemon.ID | ID} of the {@linkcode Pokemon} whose moveset has changed. */
  public pokemonId: number;
  /**
   * The {@linkcode PokemonMove} having been changed.
   * Will override the corresponding slot of the moveset flyout for that Pokemon.
   */
  public move: PokemonMove;

  constructor(pokemonId: number, move: PokemonMove) {
    super(BattleSceneEventType.MOVESET_CHANGED);

    this.pokemonId = pokemonId;
    this.move = move;
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.SUMMON_DATA_RESET} events. \
 * Emitted whenever the {@linkcode PokemonSummonData} of any {@linkcode Pokemon} is reset to its initial state
 * (such as immediately before a switch-out).
 */
export class SummonDataResetEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.SUMMON_DATA_RESET;

  /** The {@linkcode Pokemon.ID | ID} of the {@linkcode Pokemon} whose data has been reset. */
  public pokemonId: number;

  constructor(pokemonId: number) {
    super(BattleSceneEventType.SUMMON_DATA_RESET);

    this.pokemonId = pokemonId;
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.ENCOUNTER_PHASE} events.
 */
export class EncounterPhaseEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.ENCOUNTER_PHASE;
  constructor() {
    super(BattleSceneEventType.ENCOUNTER_PHASE);
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.TURN_END} events
 * @extends Event
 */
export class TurnEndEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.TURN_END;
  /** The amount of turns in the current battle */
  public turnCount: number;
  constructor(turnCount: number) {
    super(BattleSceneEventType.TURN_END);

    this.turnCount = turnCount;
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.NEW_ARENA} events
 */
export class NewArenaEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.NEW_ARENA;
  constructor() {
    super(BattleSceneEventType.NEW_ARENA);
  }
}
