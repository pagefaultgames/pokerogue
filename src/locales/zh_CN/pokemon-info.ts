import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "最大HP",
    "HPshortened": "最大HP",
    "ATK": "攻击",
    "ATKshortened": "攻击",
    "DEF": "防御",
    "DEFshortened": "防御",
    "SPATK": "特攻",
    "SPATKshortened": "特攻",
    "SPDEF": "特防",
    "SPDEFshortened": "特防",
    "SPD": "速度",
    "SPDshortened": "速度",
    "ACC": "命中率",
    "EVA": "回避率"
  },

  Type: {
    "UNKNOWN": "未知",
    "NORMAL": "一般",
    "FIGHTING": "格斗",
    "FLYING": "飞行",
    "POISON": "毒",
    "GROUND": "地面",
    "ROCK": "岩石",
    "BUG": "虫",
    "GHOST": "幽灵",
    "STEEL": "钢",
    "FIRE": "火",
    "WATER": "水",
    "GRASS": "草",
    "ELECTRIC": "电",
    "PSYCHIC": "超能力",
    "ICE": "冰",
    "DRAGON": "龙",
    "DARK": "恶",
    "FAIRY": "妖精",
    "STELLAR": "星晶",
  },
} as const;
