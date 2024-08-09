import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "on": "On",
  "off": "Off",
  "title": "Modificatori delle sfide",
  "illegalEvolution": "{{pokemon}} non è più un Pokémon\nvalido per la sfida!",
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
  "eeveeOnly": {
    "name": "Mono-Eevee",
    "desc": "Puoi usare solo Eevee e le sue evoluzioni.",
  },
  "freshStart": {
    "name": "Fresh Start",
    "desc": "You can only use the original starters, and only as if you had just started PokéRogue.",
    "value.0": "Off",
    "value.1": "On",
  }
} as const;
