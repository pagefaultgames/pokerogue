export enum BattleStat {
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD,
  ACC,
  EVA,
  RAND
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

export function getBattleStatLevelChangeDescription(levels: integer, up: boolean) {
  if (up) {
    switch (levels) {
    case 1:
      return "rose a modif";
    case 2:
      return "sharply rose a modif";
    case 3:
    case 4:
    case 5:
    case 6:
      return "rose drastically a modif";
    default:
      return "won't go any higher a modif";
    }
  } else {
    switch (levels) {
    case 1:
      return "fell a modif";
    case 2:
      return "harshly fell a modif";
    case 3:
    case 4:
    case 5:
    case 6:
      return "severely fell a modif";
    default:
      return "won't go any lower a modif";
    }
  }
}
