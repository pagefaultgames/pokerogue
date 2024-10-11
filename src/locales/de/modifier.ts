import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}} hält mithilfe des Items {{typeName}} durch!",
  "turnHealApply": "{{typeName}} von {{pokemonNameWithAffix}} füllt einige KP auf!",
  "hitHealApply": "{{typeName}} von {{pokemonNameWithAffix}} füllt einige KP auf!",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}} wurde durch {{typeName}} wiederbelebt!",
  "moneyInterestApply": "Du erhählst {{moneyAmount}} ₽ durch das Item {{typeName}}!",
  "turnHeldItemTransferApply": "{{itemName}} von {{pokemonNameWithAffix}} wurde durch {{typeName}} von {{pokemonName}} absorbiert!",
  "contactHeldItemTransferApply": "{{itemName}} von {{pokemonNameWithAffix}} wurde durch {{typeName}} von  {{pokemonName}} geklaut!",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}} stellt einige KP wieder her!",
} as const;
