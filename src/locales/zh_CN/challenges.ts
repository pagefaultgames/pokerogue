import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "适用挑战条件",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "单一世代",
    "desc": "你只能使用第{{gen}}世代的宝可梦",
    "desc_default": "你只能使用所选世代的宝可梦",
    "gen_1": "一",
    "gen_2": "二",
    "gen_3": "三",
    "gen_4": "四",
    "gen_5": "五",
    "gen_6": "六",
    "gen_7": "七",
    "gen_8": "八",
    "gen_9": "九",
  },
  "singleType": {
    "name": "单属性",
    "desc": "你只能使用{{type}}属性的宝可梦",
    "desc_default": "你只能使用所选属性的宝可梦"
  },
} as const;
