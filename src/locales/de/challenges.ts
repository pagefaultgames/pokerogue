import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Herausforderungsmodifikatoren",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "Du kannst nur Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Mono-Generation",
    "desc_default": "gewählten Generation verwenden.",
    "desc_1": "aus der ersten Generation verwenden.",
    "desc_2": "aus der zweiten Generation verwenden.",
    "desc_4": "aus der vierten Generation verwenden.",
    "desc_5": "aus der fünften Generation verwenden.",
    "desc_6": "aus der sechsten Generation verwenden.",
    "desc_7": "aus der siebten Generation verwenden.",
    "desc_8": "aus der achten Generation verwenden.",
    "desc_9": "aus der neunten Generation verwenden.",
  },
  "singleType": {
    "name": "Mono-Typ",
    "desc": "des Typs {{type}} verwenden.",
    "desc_default": "des gewählten Typs verwenden."
  },
} as const;
