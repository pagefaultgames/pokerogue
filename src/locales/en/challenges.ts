import { TranslationEntries } from "#app/interfaces/locales.js";

export const challenges: TranslationEntries = {
  "title": "Challenge Modifiers",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "Mono Gen",
    "desc": "You can only use Pokémon from Generation {{gen}}.",
    "desc_default": "You can only use Pokémon from the chosen generation.",
    "gen_1": "I",
    "gen_2": "II",
    "gen_3": "III",
    "gen_4": "IV",
    "gen_5": "V",
    "gen_6": "VI",
    "gen_7": "VII",
    "gen_8": "VIII",
    "gen_9": "IX",
  },
  "singleType": {
    "name": "Mono Type",
    "desc": "You can only use Pokémon with the {{type}} type.",
    "desc_default": "You can only use Pokémon of the chosen type."
    //types in pokemon-info
  },
  "freshStart": {
    "name": "Fresh Start",
    "desc": "You can only use the original starters, and only as if you had just started pokerogue.",
    "value.0": "Off",
    "value.1": "On",
  }
} as const;
