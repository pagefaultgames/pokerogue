import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}} tient bon\ngrâce à son {{typeName}} !",
  "turnHealApply": "Les PV de {{pokemonNameWithAffix}}\nsont un peu restaurés par les {{typeName}} !",
  "hitHealApply": "Les PV de {{pokemonNameWithAffix}}\nsont un peu restaurés par le {{typeName}} !",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}} a repris connaissance\navec sa {{typeName}} et est prêt à se battre de nouveau !",
  "moneyInterestApply": "La {{typeName}} vous rapporte\n{{moneyAmount}} ₽ d’intérêts !",
  "turnHeldItemTransferApply": "{{itemName}} de {{pokemonNameWithAffix}} est absorbé·e\npar le {{typeName}} de {{pokemonName}} !",
  "contactHeldItemTransferApply": "{{itemName}} de {{pokemonNameWithAffix}} est volé·e\npar l’{{typeName}} de {{pokemonName}} !",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}\nrestaure un peu ses PV !",
} as const;
