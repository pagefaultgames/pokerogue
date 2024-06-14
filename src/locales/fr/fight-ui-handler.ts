import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Puissance",
  "accuracy": "Précision",
  "abilityFlyInText": " {{pokemonName}}'s {{passive}}{{abilityName}}",
  "passive": "Passive ", // The space at the end is important
} as const;
