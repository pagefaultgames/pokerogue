import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Paramètres du Challenge",
  "illegalEvolution": "{{pokemon}} s’est transformé en Pokémon\ninéligible pour ce challenge !",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
  "singleGeneration": {
    "name": "Mono-génération",
    "desc": "Vous ne pouvez choisir que des Pokémon de {{gen}} génération.",
    "desc_default": "Vous ne pouvez choisir que des Pokémon de la génération sélectionnée.",
    "gen_1": "1re",
    "gen_2": "2e",
    "gen_3": "3e",
    "gen_4": "4e",
    "gen_5": "5e",
    "gen_6": "6e",
    "gen_7": "7e",
    "gen_8": "8e",
    "gen_9": "9e",
  },
  "singleType": {
    "name": "Mono-type",
    "desc": "Vous ne pouvez choisir que des Pokémon de type {{type}}.",
    "desc_default": "Vous ne pouvez choisir que des Pokémon du type sélectionné."
    //type in pokemon-info
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
