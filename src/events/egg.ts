export enum EggEventType {
  /**
   * Triggers when egg count is changed.
   * @see {@linkcode MoveUsedEvent}
   */
  EGG_COUNT_CHANGED = "onEggCountChanged"
}

/**
 * Container class for {@linkcode EggEventType.EGG_COUNT_CHANGED} events
 * @extends Event
*/
export class EggCountChangedEvent extends Event {
  /** The updated egg count. */
  public eggCount: integer;

  constructor(eggCount: number) {
    super(EggEventType.EGG_COUNT_CHANGED);
    this.eggCount = eggCount;
  }
}
