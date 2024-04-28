import i18next from "i18next";

export enum BattleStat {
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD,
  ACC,
  EVA,
  CRIT
}

export function getBattleStatName(stat: BattleStat) {
  switch (stat) {
    case BattleStat.ATK:
      return i18next.t('pokemonStat:ATK');
    case BattleStat.DEF:
      return i18next.t('pokemonStat:DEF');
    case BattleStat.SPATK:
      return i18next.t('pokemonStat:SPATK');
    case BattleStat.SPDEF:
      return i18next.t('pokemonStat:SPDEF');
    case BattleStat.SPD:
      return i18next.t('pokemonStat:SPD');
    case BattleStat.ACC:
      return i18next.t('pokemonStat:ACC');
    case BattleStat.EVA:
      return i18next.t('pokemonStat:EVA');
    case BattleStat.CRIT:
      return i18next.t('pokemonStat:CRIT');
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