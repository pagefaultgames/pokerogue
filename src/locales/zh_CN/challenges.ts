import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "适用挑战条件",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "你只能使用{{desc}}的宝可梦",
  "singleGeneration": {
    "name": "单一世代",
    "desc_default": "所选世代",
    "desc_1": "第一世代",
    "desc_2": "第二世代",
    "desc_3": "第三世代",
    "desc_4": "第四世代",
    "desc_5": "第五世代",
    "desc_6": "第六世代",
    "desc_7": "第七世代",
    "desc_8": "第八世代",
    "desc_9": "第九世代",
  },
  "singleType": {
    "name": "单属性",
    "desc": "{{type}}属性",
    "desc_default": "所选属性"
  },
} as const;
