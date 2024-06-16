import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}}'s {{abilityName}}\nprotected it from recoil!",
  "badDreams": "{{pokemonName}} is tormented!",
  "windPowerCharged": "Being hit by {{moveName}} charged {{pokemonName}} with power!",
  "perishBody": "{{pokemonName}}'s {{abilityName}}\n will faint both pokemon in 3 turns!",
} as const;
