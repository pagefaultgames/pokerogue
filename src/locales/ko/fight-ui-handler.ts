import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "위력",
  "accuracy": "명중률",
  "abilityFlyInText": " {{pokemonName}}의 {{passive}}{{abilityName}}",
  "passive": "패시브 ", // The space at the end is important
} as const;
