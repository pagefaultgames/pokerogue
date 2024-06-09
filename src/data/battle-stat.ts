import i18next from "i18next";

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

export function getBattleStatLevelChangeDescription(levels: integer, up: boolean) {
  if (up) {
    switch (levels) {
    case 1:
      return i18next.t("battle:statIsRose");
    case 2:
      return i18next.t("battle:statIsSharplyRose");
    case 3:
    case 4:
    case 5:
    case 6:
      return i18next.t("battle:statIsRoseDrastically");
    default:
      return i18next.t("battle:statIsWontGoAnyHigher");
    }
  } else {
    switch (levels) {
    case 1:
      return i18next.t("battle:statIsFell");
    case 2:
      return i18next.t("battle:statIsHarshlyFell");
    case 3:
    case 4:
    case 5:
    case 6:
      return i18next.t("battle:statIsSeverelyFell");
    default:
      return i18next.t("battle:statIsWontGoAnyLower");
    }
  }
}
