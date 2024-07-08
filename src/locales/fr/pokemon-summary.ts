import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Info Pokémon",
  "status": "Résumé",
  "powerAccuracyCategory": "Puissance\nPrécision\nCatégorie",
  "type": "Type",
  "unknownTrainer": "Inconnu",
  "ot": "D.O.",
  "nature": "de nature",
  "metAtLv": "rencontré au N.",
  "expPoints": "Points Exp.",
  "nextLv": "N. suivant",
  "cancel": "Annuler",

  "memoString": "{{natureFragment}} de nature,\n{{metFragment}}",
  "metFragment": {
    "normal": "rencontré au N.{{level}},\n{{biome}}.",
    "apparently": "apparemment rencontré au N.{{level}},\n{{biome}}.",
  },
} as const;
