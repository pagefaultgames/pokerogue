import Move from "./data/move";

export enum BattleSceneEventType {
  MOVE_USED = "onMoveUsed"
}

/**
 * Container class for `onMoveUsed` events
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
export class TurnInitEvent extends Event {
  constructor() {
    super("onTurnInit");
  }
}
export class TurnEndEvent extends Event {
  public turnCount: number;
  constructor(turnCount: number) {
    super("onTurnEnd");

    this.turnCount = turnCount;
  }
}
export class NewArenaEvent extends Event {
  constructor() {
    super("onNewArena");
  }
}
