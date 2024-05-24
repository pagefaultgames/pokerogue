import { PokemonInfoTranslationEntries } from "#app/plugins/i18n";

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
    "SPDshortened": "Veloc."
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
