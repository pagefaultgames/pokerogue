import Move from "./data/move";

/** Alias for all {@linkcode BattleScene} events */
export enum BattleSceneEventType {
  /** @see {@linkcode MoveUsedEvent} */
  MOVE_USED = "onMoveUsed",
  /** @see {@linkcode TurnInitEvent} */
  TURN_INIT = "onTurnInit",
  /** @see {@linkcode TurnEndEvent} */
  TURN_END  = "onTurnEnd",
  /** @see {@linkcode NewArenaEvent} */
  NEW_ARENA = "onNewArena",
}

/**
 * Container class for {@linkcode BattleSceneEventType.MOVE_USED} events
 * @extends Event
*/
export class MoveUsedEvent extends Event {
  /** The ID of the {@linkcode Pokemon} that used the {@linkcode Move} */
  public userId: number;
  /** The {@linkcode Move} used */
  public move: Move;
  /** The amount of PP used on the {@linkcode Move} this turn */
  public ppUsed: number;
  constructor(userId: number, move: Move, ppUsed: number) {
    super(BattleSceneEventType.MOVE_USED);

    this.userId = userId;
    this.move = move;
    this.ppUsed = ppUsed;
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.TURN_INIT} events
 * @extends Event
*/
export class TurnInitEvent extends Event {
  constructor() {
    super(BattleSceneEventType.TURN_INIT);
  }
}
/**
 * Container class for {@linkcode BattleSceneEventType.TURN_END} events
 * @extends Event
*/
export class TurnEndEvent extends Event {
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
