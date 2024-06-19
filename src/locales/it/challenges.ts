import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Modificatori delle sfide",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "Puoi usare solo Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Mono gen",
    "desc_default": "della generazione selezionata.",
    "desc_1": "di 1ª generazione.",
    "desc_2": "di 2ª generazione.",
    "desc_3": "di 3ª generazione.",
    "desc_4": "di 4ª generazione.",
    "desc_5": "di 5ª generazione.",
    "desc_6": "di 6ª generazione.",
    "desc_7": "di 7ª generazione.",
    "desc_8": "di 8ª generazione.",
    "desc_9": "di 9ª generazione.",
  },
  "singleType": {
    "name": "Mono tipo",
    "desc": "di tipo {{type}}.",
    "desc_default": "del tipo selezionato."
  },
} as const;
