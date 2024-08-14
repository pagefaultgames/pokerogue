import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "寶可夢信息",
  "status": "狀態",
  "powerAccuracyCategory": "威力\n命中率\n類別",
  "type": "屬性",
  "unknownTrainer": "未知",
  "ot": "訓練師",
  "nature": "性格",
  "expPoints": "經驗值",
  "nextLv": "下一級",
  "cancel": "取消",

  "memoString": "{{natureFragment}} 性格，\n{{metFragment}}",
  "metFragment": {
    "normal": "met at Lv{{level}},\n{{biome}}.",
    "apparently": "命中注定般地相遇于Lv.{{level}}，\n{{biome}}。",
  },
} as const;
