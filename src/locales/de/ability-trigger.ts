import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} wurde durch {{abilityName}}\nvor Rückstoß geschützt!",
  "badDreams": "{{pokemonName}} ist in einem Alptraum gefangen!",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "{{pokemonName}} wehrt Schaden\nmit {{abilityName}} ab!",
  "trace": "{{pokemonName}} copied {{targetName}}'s\n{{abilityName}}!",
  "windPowerCharged": "Der Treffer durch {{moveName}} läd die Stärke von {{pokemonName}} auf!",
} as const;
