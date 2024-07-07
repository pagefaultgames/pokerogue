import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}}用{{typeName}}\n撑住了！",
  "turnHealApply": "{{pokemonNameWithAffix}}用{{typeName}}\n回复了体力！",
  "hitHealApply": "{{pokemonNameWithAffix}}用{{typeName}}\n回复了体力！",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}}用{{typeName}}\n恢复了活力！",
  "moneyInterestApply": "用{{typeName}}\n获得了 ₽{{moneyAmount}} 利息！",
  "turnHeldItemTransferApply": "{{pokemonNameWithAffix}}的{{itemName}}被\n{{pokemonName}}的{{typeName}}吸收了！",
  "contactHeldItemTransferApply": "{{pokemonNameWithAffix}}的{{itemName}}被\n{{pokemonName}}的{{typeName}}夺取了！",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}\n回复了一些体力！",
} as const;
