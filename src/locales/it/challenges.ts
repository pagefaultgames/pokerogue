import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Modificatori delle sfide",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
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
  "nuzlocke": {
    "name": "Nuzlocke",
    "desc": "The Nuzlocke Challenge offers various restrictions to create a special challenge.",
    "desc.1": "- No revives.\n- Only the first Pokémon after a biome change can be added to the party.\n",
    "desc.2": "- No revives.\n- Only the first Pokémon after a biome change can be added to the party.\n- No heal at the end of every 10th wave.\n- No legendary starters.",
    "value.0": "Off",
    "value.1": "Regular",
    "value.2": "Hardcore",
  }
} as const;
