import { BattleStat, getBattleStatName } from "./battle-stat";

export enum TempBattleStat {
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD,
  ACC,
  CRIT
}

export function getTempBattleStatName(tempBattleStat: TempBattleStat) {
  if (tempBattleStat === TempBattleStat.CRIT) {
    return "critical-hit ratio";
  }
  return getBattleStatName(tempBattleStat as integer as BattleStat);
}

export function getTempBattleStatBoosterItemName(tempBattleStat: TempBattleStat) {
  switch (tempBattleStat) {
  case TempBattleStat.ATK:
    return "X Attack";
  case TempBattleStat.DEF:
    return "X Defense";
  case TempBattleStat.SPATK:
    return "X Sp. Atk";
  case TempBattleStat.SPDEF:
    return "X Sp. Def";
  case TempBattleStat.SPD:
    return "X Speed";
  case TempBattleStat.ACC:
    return "X Accuracy";
  case TempBattleStat.CRIT:
    return "Dire Hit";
  }
}
