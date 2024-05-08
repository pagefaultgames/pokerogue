import i18next from "../plugins/i18n";

export enum Stat {
  HP = 0,
  ATK = 1,
  DEF = 2,
  SPATK = 3,
  SPDEF = 4,
  SPD = 5,
}

export function getStatName(stat: Stat, shorten = false) {
  let ret: string;
  switch (stat) {
    case Stat.HP:
      ret = !shorten
        ? i18next.t("pokemonStat:HP")
        : i18next.t("pokemonStat:HPshortened");
      break;
    case Stat.ATK:
      ret = !shorten
        ? i18next.t("pokemonStat:ATK")
        : i18next.t("pokemonStat:ATKshortened");
      break;
    case Stat.DEF:
      ret = !shorten
        ? i18next.t("pokemonStat:DEF")
        : i18next.t("pokemonStat:DEFshortened");
      break;
    case Stat.SPATK:
      ret = !shorten
        ? i18next.t("pokemonStat:SPATK")
        : i18next.t("pokemonStat:SPATKshortened");
      break;
    case Stat.SPDEF:
      ret = !shorten
        ? i18next.t("pokemonStat:SPDEF")
        : i18next.t("pokemonStat:SPDEFshortened");
      break;
    case Stat.SPD:
      ret = !shorten
        ? i18next.t("pokemonStat:SPD")
        : i18next.t("pokemonStat:SPDshortened");
      break;
  }
  return ret;
}
