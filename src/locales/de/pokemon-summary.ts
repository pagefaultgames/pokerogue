import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Pokémon Info",
  "status": "Status",
  "powerAccuracyCategory": "Stärke\nGenauigkeit\nKategorie",
  "type": "Typ",
  "unknownTrainer": "Unbekannt",
  "ot": "OT",
  "luck": "Glück",
  "expPoints": "Erf. Punkte",
  "nextLv": "Nächstes Lvl.",
  "cancel": "Abbrechen",

  "memoString": "{{natureFragment}} Wesen,\n{{metFragment}}",
  "metFragment": {
    "normal": "getroffen auf Lvl. {{level}},\n{{biome}}.",
    "apparently": "Wahrscheinlich getroffen auf Lvl. {{level}},\n{{biome}}.",
  },
} as const;
