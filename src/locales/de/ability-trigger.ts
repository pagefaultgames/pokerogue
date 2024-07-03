import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} wurde durch {{abilityName}} vor Rückstoß geschützt!",
  "badDreams": "{{pokemonName}} ist in einem Alptraum gefangen!",
  "costar": "{{pokemonName}} kopiert die Statusveränderungen von {{allyName}}!",
  "iceFaceAvoidedDamage": "{{pokemonName}} wehrt Schaden mit {{abilityName}} ab!",
  "trace": "{{pokemonName}} kopiert {{abilityName}} von {{targetName}}!",
  "windPowerCharged": "Der Treffer durch {{moveName}} läd die Stärke von {{pokemonName}} auf!",
  "quickDraw": "Durch Schnellschuss kann {{pokemonName}} schneller handeln als sonst!",
  "disguiseAvoidedDamage" : "{{pokemonName}}'s disguise was busted!",
} as const;
