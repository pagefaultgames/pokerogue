export class EventBus {
  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode BattleSceneEventType.MOVE_USED} {@linkcode MoveUsedEvent}
   * - {@linkcode BattleSceneEventType.TURN_INIT} {@linkcode TurnInitEvent}
   * - {@linkcode BattleSceneEventType.TURN_END} {@linkcode TurnEndEvent}
   * - {@linkcode BattleSceneEventType.NEW_ARENA} {@linkcode NewArenaEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor() {}

  public emit<E extends Event = Event>(event: E): void {
    this.eventTarget.dispatchEvent(event);
  }

  public on<E extends Event = Event>(
    eventName: string,
    callback: (event: E) => void
  ): void {
    this.eventTarget.addEventListener(eventName, callback);
  }

  public off<E extends Event = Event>(
    eventName: string,
    callback: (event: E) => void
  ): void {
    this.eventTarget.removeEventListener(eventName, callback);
  }

  public once<E extends Event = Event>(
    eventName: string,
    callback: (event: E) => void
  ): void {
    this.eventTarget.addEventListener(eventName, (event: E) => {
      callback(event);
      this.off(eventName, callback);
    });
  }
}

export const eventBus = new EventBus();
