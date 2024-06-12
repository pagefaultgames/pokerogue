import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} di {{pokemonName}}\nl'ha protetto dal contraccolpo!",
  "badDreams": "{{pokemonName}} è tormentato!",
  "windPowerCharged": "{{moveName}} carica {{pokemonName}} di potenza!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evita il \ndanno con {{abilityName}}!"
} as const;
