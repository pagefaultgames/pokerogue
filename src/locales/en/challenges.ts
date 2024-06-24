import { TranslationEntries } from "#app/interfaces/locales.js";

export const challenges: TranslationEntries = {
  "title": "Challenge Modifiers",
  "start": "Start",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "Mono Gen",
    "desc": "You can only use Pokémon from Generation {{gen}}.",
    "desc_default": "You can only use Pokémon from the chosen generation.",
    "gen_1": "one",
    "gen_2": "two",
    "gen_3": "three",
    "gen_4": "four",
    "gen_5": "five",
    "gen_6": "six",
    "gen_7": "seven",
    "gen_8": "eight",
    "gen_9": "nine",
  },
  "singleType": {
    "name": "Mono Type",
    "desc": "You can only use Pokémon with the {{type}} type.",
    "desc_default": "You can only use Pokémon of the chosen type."
    //types in pokemon-info
  },
  "nuzlocke": {
    "name": "Nuzlocke",
    "desc": "Nuzlocke Ruleset:\n- No revives.\n- Only one Pokémon every 10th waves can be added to the party.\n- No heal at the end of every 10th wave.",
    "desc_default": "Nuzlocke Ruleset:\n- No revives.\n- Only one Pokémon every 10th waves can be added to the party.\n- No heal at the end of every 10th wave.",
    "on": "On"
  }
} as const;
