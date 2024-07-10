import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}} hung on\nusing its {{typeName}}!",
  "turnHealApply": "{{pokemonNameWithAffix}} restored a little HP using\nits {{typeName}}!",
  "hitHealApply": "{{pokemonNameWithAffix}} restored a little HP using\nits {{typeName}}!",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}} was revived\nby its {{typeName}}!",
  "moneyInterestApply": "You received interest of ₽{{moneyAmount}}\nfrom the {{typeName}}!",
  "turnHeldItemTransferApply": "{{pokemonNameWithAffix}}'s {{itemName}} was absorbed\nby {{pokemonName}}'s {{typeName}}!",
  "contactHeldItemTransferApply": "{{pokemonNameWithAffix}}'s {{itemName}} was snatched\nby {{pokemonName}}'s {{typeName}}!",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}\nrestored some HP!",
} as const;
