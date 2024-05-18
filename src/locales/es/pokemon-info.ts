import { PokemonInfoTranslationEntries } from "#app/plugins/i18n";

export const pokemonInfo: PokemonInfoTranslationEntries = {
    Stat: {
        "HP": "PV",
        "HPshortened": "PV",
        "ATK": "Ataque",
        "ATKshortened": "Ata",
        "DEF": "Defensa",
        "DEFshortened": "Def",
        "SPATK": "At. Esp.",
        "SPATKshortened": "AtEsp",
        "SPDEF": "Def. Esp.",
        "SPDEFshortened": "DefEsp",
        "SPD": "Velocidad",
        "SPDshortened": "Veloc."
    },

    Type: {
        "UNKNOWN": "Unknown",
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