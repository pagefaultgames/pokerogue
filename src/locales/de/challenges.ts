import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Herausforderungsmodifikatoren",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "Mono-Generation",
    "desc": "Du kannst nur Pokémon aus der {{gen}} Generation verwenden.",
    "desc_default": "Du kannst nur Pokémon gewählten Generation verwenden.",
    "gen_1": "ersten",
    "gen_2": "zweiten",
    "gen_4": "vierten",
    "gen_5": "fünften",
    "gen_6": "sechsten",
    "gen_7": "siebten",
    "gen_8": "achten",
    "gen_9": "neunten",
  },
  "singleType": {
    "name": "Mono-Typ",
    "desc": "Du kannst nur Pokémon des Typs {{type}} verwenden.",
    "desc_default": "Du kannst nur Pokémon des gewählten Typs verwenden."
    // types in pokemon-info
  },
} as const;
