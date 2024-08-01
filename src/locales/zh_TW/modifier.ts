import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}}用{{typeName}}\n撐住了！",
  "turnHealApply": "{{pokemonNameWithAffix}}用{{typeName}}\n回復了體力！",
  "hitHealApply": "{{pokemonNameWithAffix}}用{{typeName}}\n回復了體力！",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}}用{{typeName}}\n回復了活力！",
  "pokemonResetNegativeStatStageApply": "{{pokemonNameWithAffix}}'s lowered stats were restored\nby its {{typeName}}!",
  "moneyInterestApply": "用{{typeName}}\n獲得了 ₽{{moneyAmount}} 利息！",
  "turnHeldItemTransferApply": "{{pokemonNameWithAffix}}的{{itemName}}被\n{{pokemonName}}的{{typeName}}吸收了！",
  "contactHeldItemTransferApply": "{{pokemonNameWithAffix}}的{{itemName}}被\n{{pokemonName}}的{{typeName}}奪取了！",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}\n回復了一些體力！",
  "bypassSpeedChanceApply": "{{pokemonName}}用了{{itemName}}後，行動變快了！",
} as const;
