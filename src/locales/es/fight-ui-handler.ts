import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Potencia",
  "accuracy": "Precisión",
  "abilityFlyInText": " {{passive}}{{pokemonName}}\n{{abilityName}}",
  "passive": "Pasiva de ", // The space at the end is important
} as const;
