import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "最大生命",
    "HPshortened": "生命",
    "ATK": "物理攻擊",
    "ATKshortened": "物攻",
    "DEF": "物理防禦",
    "DEFshortened": "物防",
    "SPATK": "特殊攻擊",
    "SPATKshortened": "特攻",
    "SPDEF": "特殊防禦",
    "SPDEFshortened": "特防",
    "SPD": "速度",
    "SPDshortened": "速度",
    "ACC": "Accuracy",
    "EVA": "Evasiveness"
  },

  Type: {
    "UNKNOWN": "未知",
    "NORMAL": "一般",
    "FIGHTING": "格鬥",
    "FLYING": "飛行",
    "POISON": "毒",
    "GROUND": "地面",
    "ROCK": "岩石",
    "BUG": "蟲",
    "GHOST": "幽靈",
    "STEEL": "鋼",
    "FIRE": "火",
    "WATER": "水",
    "GRASS": "草",
    "ELECTRIC": "電",
    "PSYCHIC": "超能力",
    "ICE": "冰",
    "DRAGON": "龍",
    "DARK": "惡",
    "FAIRY": "妖精",
    "STELLAR": "星晶"
  },
} as const;
