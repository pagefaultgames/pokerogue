import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!",
  "badDreams": "{{pokemonName}} está tendo pesadelos!",
  "windPowerCharged": "Ser atingido por {{moveName}} carregou {{pokemonName}} com poder!",
  "perishBody": "{{pokemonName}} de {{abilityName}}\nirá desmaiar ambos os Pokémon em 3 turnos!",
  "poisonHeal": "{{pokemonName}} de {{abilityName}}\nrestaurou seus PS um pouco!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evitou\ndanos com sua {{abilityName}}!"
} as const;
