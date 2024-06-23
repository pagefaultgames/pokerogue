import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "Puissance",
  "accuracy": "Précision",
  "abilityFlyInText": " {{passive}}{{abilityName}}\nde {{pokemonName}}",
  "passive": "Passif ", // The space at the end is important
} as const;
