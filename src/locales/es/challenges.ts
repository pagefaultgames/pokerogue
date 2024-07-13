import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Parámetros de Desafíos",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
  "singleGeneration": {
    "name": "Monogeneración",
    "desc": "Solo puedes usar Pokémon de {{gen}} generación.",
    "desc_default": "Solo puedes usar Pokémon de la generación elegida.",
    "gen_1": "primera",
    "gen_2": "segunda",
    "gen_3": "tercera",
    "gen_4": "cuarta",
    "gen_5": "quinta",
    "gen_6": "sexta",
    "gen_7": "séptima",
    "gen_8": "octava",
    "gen_9": "novena",
  },
  "singleType": {
    "name": "Monotipo",
    "desc": "Solo puedes usar Pokémon with the {{type}} type.",
    "desc_default": "Solo puedes usar Pokémon del tipo elegido.",
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
