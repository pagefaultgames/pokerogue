import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "on": "On",
  "off": "Off",
  "title": "適用挑戰條件",
  "illegalEvolution": "{{pokemon}} 進化成了不符合\n挑戰條件的寶可夢！",
  "singleGeneration": {
    "name": "單一世代",
    "desc": "你只能使用第{{gen}}\n世代的寶可夢",
    "desc_default": "你只能使用所選\n世代的寶可夢",
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
    "desc": "你只能使用{{type}}\n屬性的寶可夢",
    "desc_default": "你只能使用所選\n屬性的寶可夢"
  },
  "eeveeOnly": {
    "name": "Eevee only",
    "desc": "You can use only Eevee and its evolutions in this challenge",
  },
  "freshStart": {
    "name": "Fresh Start",
    "desc": "You can only use the original starters, and only as if you had just started PokéRogue.",
    "value.0": "Off",
    "value.1": "On",
  }
} as const;
