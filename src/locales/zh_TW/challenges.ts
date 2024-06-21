import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "適用挑戰條件",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "singleGeneration": {
    "name": "單一世代",
    "desc": "你只能使用第{{gen}}世代的寶可夢",
    "desc_default": "你只能使用所選世代的寶可夢",
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
    "name": "單屬性",
    "desc": "你只能使用{{type}}屬性的寶可夢",
    "desc_default": "你只能使用所選屬性的寶可夢"
  },
} as const;
