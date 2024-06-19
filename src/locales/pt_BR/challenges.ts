import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Desafios",
  "illegalEvolution": "{{pokemon}} não pode ser escolhido\nnesse desafio!",
  "usePokemon": "Você só pode user Pokémon {{desc}}",
  "singleGeneration": {
    "name": "Geração Única",
    "desc_default": "de uma única geração.",
    "desc_1": "da primeira geração.",
    "desc_2": "da segunda geração.",
    "desc_3": "da terceira geração.",
    "desc_4": "da quarta geração.",
    "desc_5": "da quinta geração.",
    "desc_6": "da sexta geração.",
    "desc_7": "da sétima geração.",
    "desc_8": "da oitava geração.",
    "desc_9": "da nona geração.",
  },
  "singleType": {
    "name": "Tipo Único",
    "desc": "do tipo {{type}}.",
    "desc_default": "de um único tipo."
  },
} as const;
