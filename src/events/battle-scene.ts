import type { PokemonMove } from "#moves/pokemon-move";

/** Alias for all {@linkcode BattleScene} events. */
export enum BattleSceneEventType {
  /**
   * Triggers when the corresponding setting is changed
   * @see {@linkcode CandyUpgradeNotificationChangedEvent}
   */
  CANDY_UPGRADE_NOTIFICATION_CHANGED = "onCandyUpgradeNotificationChanged",

  /**
   * Triggers whenever a Pokemon's moveset is changed or altered - whether from moveset-overridding effects,
   * PP consumption or restoration.
   * @see {@linkcode MovesetChangedEvent}
   */
  MOVESET_CHANGED = "onMovePPChanged",

  /**
   * Triggers at the start of each new encounter
   * @see {@linkcode EncounterPhaseEvent}
   */
  ENCOUNTER_PHASE = "onEncounterPhase",
  /**
   * Triggers on the first turn of a new battle
   * @see {@linkcode TurnInitEvent}
   */
  TURN_INIT = "onTurnInit",
  /**
   * Triggers after a turn ends in battle
   * @see {@linkcode TurnEndEvent}
   */
  TURN_END = "onTurnEnd",

  /**
   * Triggers when a new {@linkcode Arena} is created during initialization
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
} /**
 * Container class for {@linkcode BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED} events
 * @extends Event
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
 * Emitted whenever the moveset of any on-field Pokemon is changed, or a move's PP is increased or decreased.
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
 * Container class for {@linkcode BattleSceneEventType.ENCOUNTER_PHASE} events.
 */
export class EncounterPhaseEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.ENCOUNTER_PHASE;
  constructor() {
    super(BattleSceneEventType.ENCOUNTER_PHASE);
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.TURN_INIT} events.
 */
export class TurnInitEvent extends BattleSceneEvent {
  declare type: BattleSceneEventType.TURN_INIT;
  constructor() {
    super(BattleSceneEventType.TURN_INIT);
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
 * @extends Event
 */
export class NewArenaEvent extends Event {
  constructor() {
    super(BattleSceneEventType.NEW_ARENA);
  }
}
