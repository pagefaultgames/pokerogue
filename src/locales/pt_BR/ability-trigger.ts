import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!",
  "badDreams": "{{pokemonName}} está tendo pesadelos!",
  "windPowerCharged": "Ser atingido por {{moveName}} carregou {{pokemonName}} com poder!",
  "perishBody": "{{abilityName}} de {{pokemonName}}\nirá desmaiar ambos os Pokémon em 3 turnos!",
  "poisonHeal": "{{abilityName}} de {{pokemonName}}\nrestaurou seus PS um pouco!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evitou\ndanos com sua {{abilityName}}!"
} as const;
