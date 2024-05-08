export enum BattleStat {
  ATK = 0,
  DEF = 1,
  SPATK = 2,
  SPDEF = 3,
  SPD = 4,
  ACC = 5,
  EVA = 6,
  RAND = 7,
}

export function getBattleStatName(stat: BattleStat) {
  switch (stat) {
    case BattleStat.ATK:
      return "Attack";
    case BattleStat.DEF:
      return "Defense";
    case BattleStat.SPATK:
      return "Sp. Atk";
    case BattleStat.SPDEF:
      return "Sp. Def";
    case BattleStat.SPD:
      return "Speed";
    case BattleStat.ACC:
      return "Accuracy";
    case BattleStat.EVA:
      return "Evasiveness";
    default:
      return "???";
  }
}

export function getBattleStatLevelChangeDescription(
  levels: integer,
  up: boolean,
) {
  if (up) {
    switch (levels) {
      case 1:
        return "rose";
      case 2:
        return "sharply rose";
      case 3:
      case 4:
      case 5:
      case 6:
        return "rose drastically";
      default:
        return "won't go any higher";
    }
  } else {
    switch (levels) {
      case 1:
        return "fell";
      case 2:
        return "harshly fell";
      case 3:
      case 4:
      case 5:
      case 6:
        return "severely fell";
      default:
        return "won't go any lower";
    }
  }
}
