import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "AP",
  "power": "Stärke",
  "accuracy": "Genauigkeit",
  "abilityFlyInText": "{{passive}}{{abilityName}} von {{pokemonName}} wirkt!",
  "passive": "Passive Fähigkeit ", // The space at the end is important
} as const;
