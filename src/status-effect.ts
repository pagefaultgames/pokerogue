export enum StatusEffect {
  NONE,
  POISON,
  TOXIC,
  PARALYSIS,
  SLEEP,
  FREEZE,
  BURN
}

export class Status {
  public statusType: StatusEffect;
  public turnCount: integer;

  constructor(statusType: StatusEffect) {
    this.statusType = statusType;
  }
}