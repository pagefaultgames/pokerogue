import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} 的 {{abilityName}}\n抵消了反作用力!",
  "badDreams": "{{pokemonName}} 被折磨着!",
  "windPowerCharged": "Being hit by {{moveName}} charged {{pokemonName}} with power!",
  "iceFaceAvoidedDamage": "{{pokemonName}} avoided\ndamage with {{abilityName}}!"
} as const;
