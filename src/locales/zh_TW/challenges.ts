import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "適用挑戰條件",
  "illegalEvolution": "{{pokemon}} 進化成了不符合\n挑戰條件的寶可夢！",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
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
