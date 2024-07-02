import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "PV",
    "HPshortened": "PV",
    "ATK": "Attaque",
    "ATKshortened": "Atq",
    "DEF": "Défense",
    "DEFshortened": "Déf",
    "SPATK": "Atq. Spé.",
    "SPATKshortened": "AtqSp",
    "SPDEF": "Déf. Spé.",
    "SPDEFshortened": "DéfSp",
    "SPD": "Vitesse",
    "SPDshortened": "Vit",
    "ACC": "Accuracy",
    "EVA": "Evasiveness"
  },

  Type: {
    "UNKNOWN": "Inconnu",
    "NORMAL": "Normal",
    "FIGHTING": "Combat",
    "FLYING": "Vol",
    "POISON": "Poison",
    "GROUND": "Sol",
    "ROCK": "Roche",
    "BUG": "Insecte",
    "GHOST": "Spectre",
    "STEEL": "Acier",
    "FIRE": "Feu",
    "WATER": "Eau",
    "GRASS": "Plante",
    "ELECTRIC": "Électrik",
    "PSYCHIC": "Psy",
    "ICE": "Glace",
    "DRAGON": "Dragon",
    "DARK": "Ténèbres",
    "FAIRY": "Fée",
    "STELLAR": "Stellaire",
  },
} as const;
