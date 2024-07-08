import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Info Pokémon",
  "status": "Stato",
  "powerAccuracyCategory": "Potenza\nPrecisione\nCategoria",
  "type": "Tipo",
  "unknownTrainer": "Sconosciuto",
  "ot": "AO",
  "nature": "natura",
  "expPoints": "Punti Esp.",
  "nextLv": "Prossimo Lv.",
  "cancel": "Annulla",

  "memoString": "Natura {{natureFragment}},\n{{metFragment}}",
  "metFragment": {
    "normal": "incontrato al Lv.{{level}},\n{{biome}}.",
    "apparently": "apparentemente incontrato al Lv.{{level}},\n{{biome}}.",
  },
} as const;
