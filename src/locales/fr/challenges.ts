import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "on": "Activé",
  "off": "Désactivé",
  "title": "Paramètres du Challenge",
  "illegalEvolution": "{{pokemon}} s’est transformé en Pokémon\ninéligible pour ce challenge !",
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
  "eeveeOnly": {
    "name": "Évoli uniquement",
    "desc": "Vous ne pouvez choisir que des Évoli comme starters.",
  }
} as const;
