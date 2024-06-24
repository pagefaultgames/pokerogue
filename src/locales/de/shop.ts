import { ShopTranslationEntries } from "#app/interfaces/locales";

export const shop: ShopTranslationEntries = {
  reroll: {
    name: "Reroll",
    description: "Spend money to reroll your item options.",
  },
  transfer: {
    name: "Transfer",
    description: "Transfer a held item from one Pokémon to another.",
  },
  checkTeam: {
    name: "Check Team",
    description: "Check your team or use a form changing item.",
  },
  lockRarities: {
    name: "Lock Rarities",
    description: "Lock item rarities on reroll (affects reroll cost).",
  },
} as const;
