import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const modifierSelectUiHandler: SimpleTranslationEntries = {
  "transfer": "交换道具",
  "reroll": "刷新掉落",
  "lockRarities": "锁定稀有度",
  "transferDesc": "将一只宝可梦所持有的道具交换给另一只。",
  "rerollDesc": "花钱刷新掉落道具选项。",
  "lockRaritiesDesc": "在刷新时锁定道具稀有度（影响刷新费用）。",
  "rerollCost": "₽{{cost}}",
  "itemCost": "₽{{cost}}"
} as const;
