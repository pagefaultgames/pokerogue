import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "适用挑战条件",
  "illegalEvolution": "{{pokemon}}变成了\n不符合此挑战条件的宝可梦！",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
  "singleGeneration": {
    "name": "单一世代",
    "desc": "你只能使用第{{gen}}\n世代的宝可梦",
    "desc_default": "你只能使用所选\n世代的宝可梦",
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
    "desc": "你只能使用{{type}}\n属性的宝可梦",
    "desc_default": "你只能使用所选\n属性的宝可梦"
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
