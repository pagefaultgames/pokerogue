import i18next, { ParseKeys } from "i18next";

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
    return i18next.t("pokemonInfo:Stat.ATK");
  case BattleStat.DEF:
    return i18next.t("pokemonInfo:Stat.DEF");
  case BattleStat.SPATK:
    return i18next.t("pokemonInfo:Stat.SPATK");
  case BattleStat.SPDEF:
    return i18next.t("pokemonInfo:Stat.SPDEF");
  case BattleStat.SPD:
    return i18next.t("pokemonInfo:Stat.SPD");
  case BattleStat.ACC:
    return i18next.t("pokemonInfo:Stat.ACC");
  case BattleStat.EVA:
    return i18next.t("pokemonInfo:Stat.EVA");
  default:
    return "???";
  }
}

export function getBattleStatLevelChangeDescription(pokemonNameWithAffix: string, stats: string, levels: integer, up: boolean, count: number = 1) {
  const stringKey = (() => {
    if (up) {
      switch (levels) {
      case 1:
        return "battle:statRose";
      case 2:
        return "battle:statSharplyRose";
      case 3:
      case 4:
      case 5:
      case 6:
        return "battle:statRoseDrastically";
      default:
        return "battle:statWontGoAnyHigher";
      }
    } else {
      switch (levels) {
      case 1:
        return "battle:statFell";
      case 2:
        return "battle:statHarshlyFell";
      case 3:
      case 4:
      case 5:
      case 6:
        return "battle:statSeverelyFell";
      default:
        return "battle:statWontGoAnyLower";
      }
    }
  })();
  return i18next.t(stringKey as ParseKeys, { pokemonNameWithAffix, stats, count });
}
