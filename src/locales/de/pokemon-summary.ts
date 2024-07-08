import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Pokémon Info",
  "status": "Status",
  "powerAccuracyCategory": "Stärke\nGenauigkeit\nKategorie",
  "type": "Typ",
  "unknownTrainer": "Unbekannt",
  "ot": "OT",
  "nature": "Wesen",
  "expPoints": "Erf. Punkte",
  "nextLv": "Nächstes Lvl.",
  "cancel": "Abbrechen",

  "memoString": "Wesen: {{natureFragment}}\n{{metFragment}}",
  "metFragment": {
    "normal": "Herkunft: {{biome}}\nMit Lv. {{level}} erhalten.",
    "apparently": "Herkunft: {{biome}}\nOffenbar mit Lv. {{level}} erhalten.",
  },
} as const;
