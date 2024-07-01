import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifierSelectUiHandler: SimpleTranslationEntries = {
  "transfer": "Transférer",
  "reroll": "Relancer",
  "lockRarities": "Bloquer la rareté",
  "checkTeam": "Vérifier Équipe",
  "transferDesc": "Transférer un objet tenu par un Pokémon vers un autre.",
  "rerollDesc": "Payer pour relancer les objets gratuits proposés.",
  "lockRaritiesDesc": "La relance proposera des objets gratuits de rareté\négale ou supérieure. Affecte le cout de relance.",
  "checkTeamDesc": "Vérifier votre équipe ou utiliser\nun objet de changement de forme.",
  "rerollCost": "{{formattedMoney}} ₽",
  "itemCost": "{{formattedMoney}} ₽"
} as const;
