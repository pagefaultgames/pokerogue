import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const modifierSelectUiHandler: SimpleTranslationEntries = {
  "transfer": "Transférer",
  "reroll": "Relancer",
  "lockRarities": "Bloquer la rareté",
  "transferDesc": "Transférer un objet tenu par un Pokémon vers un autre.",
  "rerollDesc": "Payer pour relancer les objets gratuits proposés.",
  "lockRaritiesDesc": "La relance proposera des objets gratuits de rareté\négale ou supérieure. Affecte le cout de relance.",
  "rerollCost": "{{cost}} ₽",
  "itemCost": "{{cost}} ₽"
} as const;
