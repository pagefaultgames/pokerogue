import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Parámetros de Desafíos",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "Solo puedes usar Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Monogeneración",
    "desc_default": "de la generación elegida.",
    "desc_1": "de primera generación.",
    "desc_2": "de segunda generación.",
    "desc_3": "de tercera generación.",
    "desc_4": "de cuarta generación.",
    "desc_5": "de quinta generación.",
    "desc_6": "de sexta generación.",
    "desc_7": "de séptima generación.",
    "desc_8": "de octava generación.",
    "desc_9": "de novena generación.",
  },
  "singleType": {
    "name": "Monotipo",
    "desc": "with the {{type}} type.",
    "desc_default": "del tipo elegido.",
  },
} as const;
