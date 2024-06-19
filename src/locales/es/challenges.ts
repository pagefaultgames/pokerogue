import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Parámetros de Desafíos",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
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
} as const;
