import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "Max. HP",
    "HPshortened": "MaxHP",
    "ATK": "Attack",
    "ATKshortened": "Atk",
    "DEF": "Defense",
    "DEFshortened": "Def",
    "SPATK": "Sp. Atk",
    "SPATKshortened": "SpAtk",
    "SPDEF": "Sp. Def",
    "SPDEFshortened": "SpDef",
    "SPD": "Speed",
    "SPDshortened": "Spd",
    "ACC": "Accuracy",
    "EVA": "Evasiveness"
  },

  Type: {
    "UNKNOWN": "Unknown",
    "NORMAL": "Normal",
    "FIGHTING": "Fighting",
    "FLYING": "Flying",
    "POISON": "Poison",
    "GROUND": "Ground",
    "ROCK": "Rock",
    "BUG": "Bug",
    "GHOST": "Ghost",
    "STEEL": "Steel",
    "FIRE": "Fire",
    "WATER": "Water",
    "GRASS": "Grass",
    "ELECTRIC": "Electric",
    "PSYCHIC": "Psychic",
    "ICE": "Ice",
    "DRAGON": "Dragon",
    "DARK": "Dark",
    "FAIRY": "Fairy",
    "STELLAR": "Stellar",
  },
} as const;
