import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Info. Pokémon",
  "status": "Estado",
  "powerAccuracyCategory": "Potencia\nPrecisión\nCategoria",
  "type": "Tipo",
  "unknownTrainer": "Desconocido",
  "ot": "EO",
  "luck": "Suerte",
  "expPoints": "Puntos Exp.",
  "nextLv": "Nv. siguiente",
  "cancel": "Salir",

  "memoString": "{{natureFragment}} de naturaleza,\n{{metFragment}}",
  "metFragment": {
    "normal": "encontrado al Nv.{{level}},\n{{biome}}.",
    "apparently": "aparentemente encontrado al Nv.{{level}},\n{{biome}}.",
  },
} as const;
