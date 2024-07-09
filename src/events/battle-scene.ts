import Move from "../data/move";
import { BerryModifier } from "../modifier/modifier";

/** Alias for all {@linkcode BattleScene} events */
export enum BattleSceneEventType {
  /**
   * Triggers when the corresponding setting is changed
   * @see {@linkcode BattleCandyUpgradeNotificationChangedEvent}
   */
  CANDY_UPGRADE_NOTIFICATION_CHANGED = "battle/candyUpgradeNotification/changed",

  /**
   * Triggers when a move is successfully used
   * @see {@linkcode BattleMoveUsedEvent}
   */
  MOVE_USED = "battle/move/used",
  /**
   * Triggers when a berry gets successfully used
   * @see {@linkcode BattleBerryUsedEvent}
   */
  BERRY_USED = "battle/berry/used",

  /**
   * Triggers at the start of each new encounter
   * @see {@linkcode BattleEncounterPhaseEvent}
   */
  ENCOUNTER_PHASE = "battle/encounter/start",
  /**
   * Triggers on the first turn of a new battle
   * @see {@linkcode BattleTurnInitEvent}
   */
  TURN_INIT = "battle/turn/init",
  /**
   * Triggers after a turn ends in battle
   * @see {@linkcode BattleTurnEndEvent}
   */
  TURN_END  = "battle/turn/end",

  /**
   * Triggers when a new {@linkcode Arena} is created during initialization
   * @see {@linkcode BattleNewArenaEvent}
   */
  NEW_ARENA = "battle/arena/new",
}

/**
 * Container class for {@linkcode BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED} events
 * @extends Event
*/
export class BattleCandyUpgradeNotificationChangedEvent extends Event {
  /** The new value the setting was changed to */
  public newValue: number;
  constructor(newValue: number) {
    super(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED);

    this.newValue = newValue;
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.MOVE_USED} events
 * @extends Event
*/
export class BattleMoveUsedEvent extends Event {
  /** The ID of the {@linkcode Pokemon} that used the {@linkcode Move} */
  public pokemonId: number;
  /** The {@linkcode Move} used */
  public move: Move;
  /** The amount of PP used on the {@linkcode Move} this turn */
  public ppUsed: number;
  constructor(userId: number, move: Move, ppUsed: number) {
    super(BattleSceneEventType.MOVE_USED);

    this.pokemonId = userId;
    this.move = move;
    this.ppUsed = ppUsed;
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.BERRY_USED} events
 * @extends Event
*/
export class BattleBerryUsedEvent extends Event {
  /** The {@linkcode BerryModifier} being used */
  public berryModifier: BerryModifier;
  constructor(berry: BerryModifier) {
    super(BattleSceneEventType.BERRY_USED);

    this.berryModifier = berry;
  }
}

/**
 * Container class for {@linkcode BattleSceneEventType.ENCOUNTER_PHASE} events
 * @extends Event
*/
export class BattleEncounterPhaseEvent extends Event {
  constructor() {
    super(BattleSceneEventType.ENCOUNTER_PHASE);
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.TURN_INIT} events
 * @extends Event
*/
export class BattleTurnInitEvent extends Event {
  constructor() {
    super(BattleSceneEventType.TURN_INIT);
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.TURN_END} events
 * @extends Event
*/
export class BattleTurnEndEvent extends Event {
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
export class BattleNewArenaEvent extends Event {
  constructor() {
    super(BattleSceneEventType.NEW_ARENA);
  }
}
