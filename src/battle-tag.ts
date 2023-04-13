export enum BattleTagType {
  NONE,
  FLYING,
  UNDERGROUND
}

export enum BattleTagLapseType {
  FAINT,
  MOVE,
  TURN_END
}

export class BattleTag {
  public tagType: BattleTagType;
  public lapseType: BattleTagLapseType;
  public turnCount: integer;

  constructor(tagType: BattleTagType, lapseType: BattleTagLapseType, turnCount: integer) {
    this.tagType = tagType;
    this.lapseType = lapseType;
    this.turnCount = turnCount;
  }

  isHidden() {
    switch (this.tagType) {
      case BattleTagType.FLYING:
      case BattleTagType.UNDERGROUND:
        return true;
    }

    return false;
  }
}