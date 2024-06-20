import { PokemonInfoTranslationEntries } from "#app/interfaces/locales";

export const pokemonInfo: PokemonInfoTranslationEntries = {
  Stat: {
    "HP": "HP สูงสด",
    "HPshortened": "HP สูงสด",
    "ATK": "โจมตี",
    "ATKshortened": "Atk",
    "DEF": "ป้องกัน",
    "DEFshortened": "Def",
    "SPATK": "Sp. Atk",
    "SPATKshortened": "SpAtk",
    "SPDEF": "Sp. Def",
    "SPDEFshortened": "SpDef",
    "SPD": "ความเร็ว",
    "SPDshortened": "Spd",
    "ACC": "ความแม่นยำ",
    "EVA": "การหลบเลี่ยง"
  },

  Type: {
    "UNKNOWN": "ไม่รู้จัก",
    "NORMAL": "ปกติ",
    "FIGHTING": "สู้รบ",
    "FLYING": "บิน",
    "POISON": "พิษ",
    "GROUND": "ดิน",
    "ROCK": "หิน",
    "BUG": "แมลง",
    "GHOST": "ผี",
    "STEEL": "เหล็ก",
    "FIRE": "ไฟ",
    "WATER": "น้ำ",
    "GRASS": "หญ้า",
    "ELECTRIC": "ไฟฟ้า",
    "PSYCHIC": "จิต",
    "ICE": "น้ำแข็ง",
    "DRAGON": "มังกร",
    "DARK": "มืด",
    "FAIRY": "นางฟ้า",
    "STELLAR": "ดาวกฤษ์"
  },
} as const;
