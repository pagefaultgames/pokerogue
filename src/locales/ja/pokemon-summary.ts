import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Pokémon Info",
  "status": "Status",
  "powerAccuracyCategory": "Power\nAccuracy\nCategory",
  "type": "Type",
  "unknownTrainer": "Unknown",
  "ot": "OT",
  "nature": "nature",
  "expPoints": "Exp. Points",
  "nextLv": "Next Lv.",
  "cancel": "Cancel",

  "memoString": "{{natureFragment}} nature,\n{{metFragment}}",
  "metFragment": {
    "normal": "met at Lv{{level}},\n{{biome}}.",
    "apparently": "apparently met at Lv{{level}},\n{{biome}}.",
  },
} as const;
