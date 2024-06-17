import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Potenza",
  "accuracy": "Precisione",
  "abilityFlyInText": "{{passive}} {{pokemonName}} {{abilityName}}",
  "passive": "Passiva di ", // The space at the end is important
} as const;
