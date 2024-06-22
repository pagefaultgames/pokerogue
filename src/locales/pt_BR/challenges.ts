import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Desafios",
  "illegalEvolution": "{{pokemon}} não pode ser escolhido\nnesse desafio!",
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
    "name": "Tipo Único",
    "desc": "Você só pode user Pokémon do tipo {{type}}.",
    "desc_default": "Você só pode user Pokémon de um único tipo."
  },
} as const;
