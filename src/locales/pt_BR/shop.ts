import { ShopTranslationEntries } from "#app/interfaces/locales";

export const shop: ShopTranslationEntries = {
  reroll: {
    name: "Atualizar",
    description: "Gaste dinheiro para atualizar as suas opções de itens.",
  },
  transfer: {
    name: "Alterar",
    description: "Transfira um item segurado de um Pokémon para outro.",
  },
  checkTeam: {
    name: "Checar Time",
    description: "Cheque seu time ou use um item de mudança de forma.",
  },
  lockRarities: {
    name: "Travar Raridades",
    description: "Trava a raridade dos itens na atualização (afeta o custo da atualização).",
  },
} as const;
