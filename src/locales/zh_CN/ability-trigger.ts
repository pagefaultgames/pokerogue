import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} 的 {{abilityName}}\n抵消了反作用力！",
  "badDreams": "{{pokemonName}} 被折磨着！",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "{{pokemonName}} 因为 {{abilityName}}\n避免了伤害！",
  "trace": "{{pokemonName}} copied {{targetName}}'s\n{{abilityName}}!",
  "windPowerCharged": "受 {{moveName}} 的影响， {{pokemonName}} 提升了能力！",
  "quickDraw":"{{pokemonName}} can act faster than normal, thanks to its Quick Draw!",
} as const;
