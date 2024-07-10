import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Info. Pokémon",
  "status": "Estado",
  "powerAccuracyCategory": "Potencia\nPrecisión\nCategoría",
  "type": "Tipo",
  "unknownTrainer": "Desconocido",
  "ot": "EO",
  "nature": "Naturaleza",
  "expPoints": "Puntos Exp.",
  "nextLv": "Nv. siguiente",
  "cancel": "Salir",

  "memoString": "Naturaleza {{natureFragment}},\n{{metFragment}}",
  "metFragment": {
    "normal": "encontrado al Nv. {{level}},\n{{biome}}.",
    "apparently": "aparentemente encontrado al Nv. {{level}},\n{{biome}}.",
  },
} as const;
