import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "威力",
  "accuracy": "命中率",
  "abilityFlyInText": " {{pokemonName}} 的 {{passive}}{{abilityName}}",
  "passive": "被動能力 ", // The space at the end is important
} as const;
