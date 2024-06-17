import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "PS Max",
    "HPshortened": "PS",
    "ATK": "Attacco",
    "ATKshortened": "Att",
    "DEF": "Difesa",
    "DEFshortened": "Dif",
    "SPATK": "Att. Sp.",
    "SPATKshortened": "AttSp",
    "SPDEF": "Dif. Sp.",
    "SPDEFshortened": "DifSp",
    "SPD": "Velocità",
    "SPDshortened": "Vel",
    "ACC": "Precisione",
    "EVA": "Elusione"
  },

  Type: {
    "UNKNOWN": "Sconosciuto",
    "NORMAL": "Normale",
    "FIGHTING": "Lotta",
    "FLYING": "Volante",
    "POISON": "Veleno",
    "GROUND": "Terra",
    "ROCK": "Roccia",
    "BUG": "Coleottero",
    "GHOST": "Spettro",
    "STEEL": "Acciaio",
    "FIRE": "Fuoco",
    "WATER": "Acqua",
    "GRASS": "Erba",
    "ELECTRIC": "Elettro",
    "PSYCHIC": "Psico",
    "ICE": "Ghiaccio",
    "DRAGON": "Drago",
    "DARK": "Buio",
    "FAIRY": "Folletto",
    "STELLAR": "Astrale",
  },
} as const;
