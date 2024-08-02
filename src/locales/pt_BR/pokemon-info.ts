import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "PS",
    "HPshortened": "PS",
    "ATK": "Ataque",
    "ATKshortened": "Ata",
    "DEF": "Defesa",
    "DEFshortened": "Def",
    "SPATK": "At. Esp.",
    "SPATKshortened": "AtEsp",
    "SPDEF": "Def. Esp.",
    "SPDEFshortened": "DefEsp",
    "SPD": "Veloc.",
    "SPDshortened": "Veloc.",
    "ACC": "Precisão",
    "EVA": "Evasão",
  },

  Type: {
    "UNKNOWN": "Desconhecido",
    "NORMAL": "Normal",
    "FIGHTING": "Lutador",
    "FLYING": "Voador",
    "POISON": "Veneno",
    "GROUND": "Terra",
    "ROCK": "Pedra",
    "BUG": "Inseto",
    "GHOST": "Fantasma",
    "STEEL": "Aço",
    "FIRE": "Fogo",
    "WATER": "Água",
    "GRASS": "Grama",
    "ELECTRIC": "Elétrico",
    "PSYCHIC": "Psíquico",
    "ICE": "Gelo",
    "DRAGON": "Dragão",
    "DARK": "Sombrio",
    "FAIRY": "Fada",
    "STELLAR": "Estelar"
  },
} as const;
