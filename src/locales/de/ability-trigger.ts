import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} wurde durch {{abilityName}}\nvor Rückstoß geschützt!",
  "badDreams": "{{pokemonName}} ist in einem Alptraum gefangen!",
  "windPowerCharged": "Der Treffer durch {{moveName}} läd die Stärke von {{pokemonName}} auf!",
  "iceFaceAvoidedDamage": "{{pokemonName}} wehrt Schaden\nmit {{abilityName}} ab!",
} as const;
