import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Modificatori delle sfide",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "Mono gen",
    "desc": "Puoi usare solo Pokémon di {{gen}} generazione.",
    "desc_default": "Puoi usare solo Pokémon della generazione selezionata.",
    "gen_1": "1ª",
    "gen_2": "2ª",
    "gen_3": "3ª",
    "gen_4": "4ª",
    "gen_5": "5ª",
    "gen_6": "6ª",
    "gen_7": "7ª",
    "gen_8": "8ª",
    "gen_9": "9ª",
  },
  "singleType": {
    "name": "Mono tipo",
    "desc": "Puoi usare solo Pokémon di tipo {{type}}.",
    "desc_default": "Puoi usare solo Pokémon del tipo selezionato."
  },
} as const;
