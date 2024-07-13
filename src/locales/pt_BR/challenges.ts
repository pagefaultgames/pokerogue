import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Desafios",
  "illegalEvolution": "{{pokemon}} não pode ser escolhido\nnesse desafio!",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
  "singleGeneration": {
    "name": "Geração Única",
    "desc": "Você só pode user Pokémon da {{gen}} geração.",
    "desc_default": "Você só pode user Pokémon de uma única geração.",
    "gen_1": "primeira",
    "gen_2": "segunda",
    "gen_3": "terceira",
    "gen_4": "quarta",
    "gen_5": "quinta",
    "gen_6": "sexta",
    "gen_7": "sétima",
    "gen_8": "oitava",
    "gen_9": "nona",
  },
  "singleType": {
    "name": "Monotipo",
    "desc": "Você só pode user Pokémon do tipo {{type}}.",
    "desc_default": "Você só pode user Pokémon de um único tipo."
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
