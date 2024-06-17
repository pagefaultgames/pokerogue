import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}}'s {{abilityName}}\nprotected it from recoil!",
  "badDreams": "{{pokemonName}} is tormented!",
  "windPowerCharged": "Being hit by {{moveName}} charged {{pokemonName}} with power!",
  "perishBody": "{{pokemonName}}'s {{abilityName}}\nwill faint both pokemon in 3 turns!",
  "poisonHeal": "{{pokemonName}}'s {{abilityName}}\nrestored its HP a little!",
  "iceFaceAvoidedDamage": "{{pokemonName}} avoided\ndamage with {{abilityName}}!"
} as const;
