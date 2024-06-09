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
    return i18next.t("battleStat:attack");
  case BattleStat.DEF:
    return i18next.t("battleStat:defense");
  case BattleStat.SPATK:
    return i18next.t("battleStat:specialAttack");
  case BattleStat.SPDEF:
    return i18next.t("battleStat:specialDefense");
  case BattleStat.SPD:
    return i18next.t("battleStat:speed");
  case BattleStat.ACC:
    return i18next.t("battleStat:accuracy");
  case BattleStat.EVA:
    return i18next.t("battleStat:evasiveness");
  default:
    return "???";
  }
}

export function getBattleStatLevelChangeDescription(levels: integer, up: boolean) {
  if (up) {
    switch (levels) {
    case 1:
      return i18next.t("battleStat:rose");
    case 2:
      return i18next.t("battleStat:sharplyRose");
    case 3:
    case 4:
    case 5:
    case 6:
      return i18next.t("battleStat:roseDrastically");
    default:
      return i18next.t("battleStat:anyHigher");
    }
  } else {
    switch (levels) {
    case 1:
      return i18next.t("battleStat:fell");
    case 2:
      return i18next.t("battleStat:harshlyFell");
    case 3:
    case 4:
    case 5:
    case 6:
      return i18next.t("battleStat:severelyFell");
    default:
      return i18next.t("battleStat:anyLower");
    }
  }
}
