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
      return 'ATTACK';
    case BattleStat.DEF:
      return 'DEFENSE';
    case BattleStat.SPATK:
      return 'SP. ATK';
    case BattleStat.SPDEF:
      return 'SP. DEF';
    case BattleStat.SPD:
      return 'SPEED';
    case BattleStat.ACC:
      return 'accuracy';
    case BattleStat.EVA:
      return 'evasiveness';
    default:
      return '???';
  }
}

export function getBattleStatLevelChangeDescription(levels: integer, up: boolean) {
  if (up) {
    switch (levels) {
      case 1:
        return 'rose';
      case 2:
        return 'sharply rose';
      case 3:
      case 4:
      case 5:
      case 6:
        return 'rose drastically'; 
      default:
        return 'won\'t go any higher';
    }
  } else {
    switch (levels) {
      case 1:
        return 'fell';
      case 2:
        return 'harshly fell';
      case 3:
      case 4:
      case 5:
      case 6:
        return 'severely fell';
      default:
        return 'won\'t go any lower';
    }
  }
}