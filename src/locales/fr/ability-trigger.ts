import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}}\nde {{pokemonName}} le protège du contrecoup !",
  "badDreams": "{{pokemonName}} a le sommeil agité !",
  "windPowerCharged": "Being hit by {{moveName}} charged {{pokemonName}} with power!",
  "windRiderRaisedAttack": "{{pokemonName}}'s wind rider raised its attack!"
} as const;
