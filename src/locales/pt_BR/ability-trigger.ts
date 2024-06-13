import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!",
  "badDreams": "{{pokemonName}} está tendo pesadelos!",
  "windPowerCharged": "Ser atingido por {{moveName}} carregou {{pokemonName}} com poder!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evitou\ndanos com sua {{abilityName}}!"
} as const;
