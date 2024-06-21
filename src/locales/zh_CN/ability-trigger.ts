import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} 的 {{abilityName}}\n抵消了反作用力！",
  "badDreams": "{{pokemonName}} 被折磨着！",
  "windPowerCharged": "受 {{moveName}} 的影响， {{pokemonName}} 提升了能力！",
  "iceFaceAvoidedDamage": "{{pokemonName}} 因为 {{abilityName}}\n避免了伤害！"
} as const;
