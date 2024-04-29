import i18next from "i18next";
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
  if (tempBattleStat === TempBattleStat.CRIT)
    return i18next.t('pokemonStat:CRIT');
  return getBattleStatName(tempBattleStat as integer as BattleStat);
}

export function getTempBattleStatBoosterItemName(tempBattleStat: TempBattleStat) {
  switch (tempBattleStat) {
    case TempBattleStat.ATK:
      return i18next.t('modifierType:X_ATTACK.name');
    case TempBattleStat.DEF:
      return i18next.t('modifierType:X_DEFENSE.name');
    case TempBattleStat.SPATK:
      return i18next.t('modifierType:X_SPATK.name');
    case TempBattleStat.SPDEF:
      return i18next.t('modifierType:X_SPDEF.name');
    case TempBattleStat.SPD:
      return i18next.t('modifierType:X_SPEED.name');
    case TempBattleStat.ACC:
      return i18next.t('modifierType:X_ACCURACY.name');
    case TempBattleStat.CRIT:
      return i18next.t('modifierType:DIRE_HIT.name');
  }
}

export function getTempBattleStatBoosterIconName(tempBattleStat: TempBattleStat) {
  switch (tempBattleStat) {
    case TempBattleStat.ATK:
      return 'x_attack';
    case TempBattleStat.DEF:
      return 'x_defense';
    case TempBattleStat.SPATK:
      return 'x_sp_atk';
    case TempBattleStat.SPDEF:
      return 'x_sp_def';
    case TempBattleStat.SPD:
      return 'x_speed';
    case TempBattleStat.ACC:
      return 'x_accuracy';
    case TempBattleStat.CRIT:
      return 'dire_hit';
  }
}