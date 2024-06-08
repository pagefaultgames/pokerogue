import { PokemonInfoTranslationEntries } from "#app/plugins/i18n";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "HP",
    "HPshortened": "HP",
    "ATK": "공격",
    "ATKshortened": "공격",
    "DEF": "방어",
    "DEFshortened": "방어",
    "SPATK": "특수공격",
    "SPATKshortened": "특공",
    "SPDEF": "특수방어",
    "SPDEFshortened": "특방",
    "SPD": "스피드",
    "SPDshortened": "스피드"
  },

  Type: {
    "UNKNOWN": "Unknown",
    "NORMAL": "노말",
    "FIGHTING": "격투",
    "FLYING": "비행",
    "POISON": "독",
    "GROUND": "땅",
    "ROCK": "바위",
    "BUG": "벌레",
    "GHOST": "고스트",
    "STEEL": "강철",
    "FIRE": "불꽃",
    "WATER": "물",
    "GRASS": "풀",
    "ELECTRIC": "전기",
    "PSYCHIC": "에스퍼",
    "ICE": "얼음",
    "DRAGON": "드래곤",
    "DARK": "악",
    "FAIRY": "페어리",
    "STELLAR": "스텔라",
  },
} as const;
