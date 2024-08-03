import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "PS",
    "HPshortened": "PS",
    "ATK": "Ataque",
    "ATKshortened": "Ata",
    "DEF": "Defensa",
    "DEFshortened": "Def",
    "SPATK": "At. Esp.",
    "SPATKshortened": "AtEsp",
    "SPDEF": "Def. Esp.",
    "SPDEFshortened": "DefEsp",
    "SPD": "Velocidad",
    "SPDshortened": "Veloc.",
    "ACC": "Accuracy",
    "EVA": "Evasiveness"
  },

  Type: {
    "UNKNOWN": "Desconocido",
    "NORMAL": "Normal",
    "FIGHTING": "Lucha",
    "FLYING": "Volador",
    "POISON": "Veneno",
    "GROUND": "Tierra",
    "ROCK": "Roca",
    "BUG": "Bicho",
    "GHOST": "Fantasma",
    "STEEL": "Acero",
    "FIRE": "Fuego",
    "WATER": "Agua",
    "GRASS": "Planta",
    "ELECTRIC": "Eléctrico",
    "PSYCHIC": "Psíquico",
    "ICE": "Hielo",
    "DRAGON": "Dragón",
    "DARK": "Siniestro",
    "FAIRY": "Hada",
    "STELLAR": "Astral",
  },
} as const;
