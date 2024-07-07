import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}} tient bon grâce à {{typeName}} !",
  "turnHealApply": "Les PV du {{pokemonNameWithAffix}}\nsont un peu restaurés par {{typeName}} !",
  "hitHealApply": "Les PV du {{pokemonNameWithAffix}}\nsont un peu restaurés par {{typeName}} !",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}} a repris connaissance\navec {{typeName}} et est prêt à se battre de nouveau !",
  "moneyInterestApply": "Vous recevez {{moneyAmount}} ₽\nd’intérets de la {{typeName}} !",
  "turnHeldItemTransferApply": "{{itemName}} de {{pokemonNameWithAffix}} est absorbé\npar le {{typeName}} de {{pokemonName}} !",
  "contactHeldItemTransferApply": "{{itemName}} de {{pokemonNameWithAffix}} est volé\npar {{typeName}} de {{pokemonName}} !",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}\nrestaure un peu ses PV !",
} as const;
