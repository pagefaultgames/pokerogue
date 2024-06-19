import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Paramètres du Challenge",
  "illegalEvolution": "{{pokemon}} s’est transformé en Pokémon\ninéligible pour ce challenge !",
  "usePokemon": "Vous ne pouvez choisir que des Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Mono-génération",
    "desc_default": "de la génération sélectionnée.",
    "desc_1": "de 1re génération.",
    "desc_2": "de 2e génération.",
    "desc_3": "de 3e génération.",
    "desc_4": "de 4e génération.",
    "desc_5": "de 5e génération.",
    "desc_6": "de 6e génération.",
    "desc_7": "de 7e génération.",
    "desc_8": "de 8e génération.",
    "desc_9": "de 9e génération.",
  },
  "singleType": {
    "name": "Mono-type",
    "desc": "de type {{type}}.",
    "desc_default": "du type sélectionné."
  },
} as const;
