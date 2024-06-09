export enum EggEventType {
    EGG_COUNT_CHANGED = "onEggCountChanged"
}

export class EggCountChangedEvent extends Event {
  public eggCount: integer;

  constructor(eggCount: number) {
    super(EggEventType.EGG_COUNT_CHANGED);
    this.eggCount = eggCount;
  }
}
