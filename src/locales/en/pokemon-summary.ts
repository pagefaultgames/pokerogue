import { PokemonSummaryEntries } from "#app/interfaces/locales.js";

export const pokemonSummary: PokemonSummaryEntries = {
  "pokemonInfo": "Pokémon Info",
  "status": "Status",
  "powerAccuracyCategory": "Power\nAccuracy\nCategory",
  "type": "Type",
  "unknownTrainer": "Unknown",
  "ot": "OT",
  "luck": "Luck",
  "expPoints": "Exp. Points",
  "nextLv": "Next Lv.",
  "cancel": "Cancel",

  "memoString": "{{natureFragment}} nature,\n{{metFragment}}",
  "metFragment": {
    "normal": "met at Lv{{level}},\n{{biome}}.",
    "apparently": "apparently met at Lv{{level}},\n{{biome}}.",
  }
} as const;
