import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Poder",
  "accuracy": "Precisão",
  "abilityFlyInText": " {{pokemonName}}'s {{passive}}{{abilityName}}",
  "passive": "Passive ", // The space at the end is important
} as const;
