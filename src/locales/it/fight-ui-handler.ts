import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Potenza",
  "accuracy": "Precisione",
  "abilityFlyInText": "{{passive}} {{pokemonName}} {{abilityName}}",
  "passive": "Passiva di ", // The space at the end is important
} as const;
