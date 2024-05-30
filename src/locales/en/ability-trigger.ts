import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}}'s {{abilityName}}\nprotected it from recoil!",
  "badDreams": "{{pokemonName}} is tormented!",
  "windPowerCharged": "Being hit by {{moveName}} charged {{pokemonName}} with power!",
  "windRiderRaisedAttack": "{{pokemonName}}'s wind rider raised its attack!"
} as const;
