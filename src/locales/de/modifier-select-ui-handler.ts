import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const modifierSelectUiHandler: SimpleTranslationEntries = {
  "transfer": "Transfer",
  "reroll": "Reroll",
  "lockRarities": "Lock Rarities",
  "transferDesc": "Transfer a held item from one Pokémon to another.",
  "rerollDesc": "Spend money to reroll your item options.",
  "lockRaritiesDesc": "Lock item rarities on reroll (affects reroll cost).",
  "rerollCost": "₽{{cost}}",
  "itemCost": "₽{{cost}}"
} as const;
