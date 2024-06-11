import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} wurde durch {{abilityName}}\nvor Rückstoß geschützt!",
  "badDreams": "{{pokemonName}} ist in einem Alptraum gefangen!",
  "windPowerCharged": "Der Treffer durch {{moveName}} läd die Stärke von {{pokemonName}} auf!",
  "iceFaceAvoidedDamage": "{{pokemonName}} avoided\ndamage with {{abilityName}}!",
} as const;
