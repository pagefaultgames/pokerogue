import { BattleStat, getBattleStatName } from "./battle-stat";

export enum TempBattleStat {
  ATK = 0,
  DEF = 1,
  SPATK = 2,
  SPDEF = 3,
  SPD = 4,
  ACC = 5,
  CRIT = 6,
}

export function getTempBattleStatName(tempBattleStat: TempBattleStat) {
  if (tempBattleStat === TempBattleStat.CRIT) return "critical-hit ratio";
  return getBattleStatName(tempBattleStat as integer as BattleStat);
}

export function getTempBattleStatBoosterItemName(
  tempBattleStat: TempBattleStat,
) {
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
