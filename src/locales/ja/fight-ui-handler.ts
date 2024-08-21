import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "いりょく",
  "accuracy": "めいちゅう",
  "abilityFlyInText": " {{pokemonName}}の {{passive}}{{abilityName}}",
  "passive": "Passive ", // The space at the end is important
} as const;
