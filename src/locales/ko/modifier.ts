import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}}[[는]]\n{{typeName}}[[로]] 버텼다!!",
  "turnHealApply": "{{pokemonNameWithAffix}}[[는]]\n{{typeName}}[[로]] 인해 조금 회복했다.",
  "hitHealApply": "{{pokemonNameWithAffix}}[[는]]\n{{typeName}}[[로]] 인해 조금 회복했다.",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}}[[는]] {{typeName}}[[로]]\n정신을 차려 싸울 수 있게 되었다!",
  "pokemonResetNegativeStatStageApply": "{{pokemonNameWithAffix}}'s lowered stats were restored\nby its {{typeName}}!",
  "moneyInterestApply": "{{typeName}}[[로]]부터\n₽{{moneyAmount}}[[를]] 받았다!",
  "turnHeldItemTransferApply": "{{pokemonName}}의 {{typeName}}[[는]]\n{{pokemonNameWithAffix}}의 {{itemName}}[[를]] 흡수했다!",
  "contactHeldItemTransferApply": "{{pokemonName}}의 {{typeName}}[[는]]\n{{pokemonNameWithAffix}}의 {{itemName}}[[를]] 가로챘다!",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}의\n체력이 약간 회복되었다!",
  "bypassSpeedChanceApply": "{{pokemonName}}[[는]] {{itemName}}[[로]]\n행동이 빨라졌다!",
} as const;
