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
import i18next from "#app/plugins/i18n";
export function getBattleStatName(stat: BattleStat) {
  switch (stat) {
    case BattleStat.ATK:
      return i18next.t('battle:Attack');
    case BattleStat.DEF:
      return i18next.t('battle:Defense');
    case BattleStat.SPATK:
      return i18next.t('battle:Sp_Atk');
    case BattleStat.SPDEF:
      return i18next.t('battle:Sp_Def');
    case BattleStat.SPD:
      return i18next.t('battle:Speed');
    case BattleStat.ACC:
      return i18next.t('battle:Accuracy');
    case BattleStat.EVA:
      return i18next.t('battle:Evasiveness');
    default:
      return '???';
  }
}

export function getBattleStatLevelChangeDescription(levels: integer, up: boolean) {
  if (up) {
    switch (levels) {
      case 1:
        return i18next.t('battle:rose');
      case 2:
        return i18next.t('battle:sharply_rose');
      case 3:
      case 4:
      case 5:
      case 6:
        return i18next.t('battle:rose_drastically');
      default:
        return i18next.t('battle:won_t_go_any_higher');
    }
  } else {
    switch (levels) {
      case 1:
        return i18next.t('battle:fell');
      case 2:
        return i18next.t('battle:harshly_fell');
      case 3:
      case 4:
      case 5:
      case 6:
        return i18next.t('battle:severely_fell');
      default:
        return i18next.t('battle:won_t_go_any_lower');
    }
  }
}