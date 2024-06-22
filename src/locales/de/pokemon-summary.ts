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

  "memoString": "Wesen: {{natureFragment}}\n{{metFragment}}",
  "metFragment": {
    "normal": "{{biome}}\nGetroffen auf Lvl. {{level}}.",
    "apparently": "{{biome}}\nWahrscheinlich getroffen auf Lvl. {{level}}.",
  },
} as const;
