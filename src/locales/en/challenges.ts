import { TranslationEntries } from "#app/interfaces/locales.js";

export const challenges: TranslationEntries = {
  "title": "Challenge Modifiers",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "You can only use Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Mono Gen",
    "desc_default": "from the chosen generation.",
    "desc_1": "from generation one.",
    "desc_2": "from generation two.",
    "desc_3": "from generation three.",
    "desc_4": "from generation four.",
    "desc_5": "from generation five.",
    "desc_6": "from generation six.",
    "desc_7": "from generation seven.",
    "desc_8": "from generation eight.",
    "desc_9": "from generation nine.",
  },
  "singleType": {
    "name": "Mono Type",
    "desc": "with the {{type}} type.",
    "desc_default": "of the chosen type."
  },
} as const;
