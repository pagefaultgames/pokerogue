import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!",
  "badDreams": "{{pokemonName}} está tendo pesadelos!",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evitou\ndanos com sua {{abilityName}}!",
  "perishBody": "{{abilityName}} de {{pokemonName}}\nirá desmaiar ambos os Pokémon em 3 turnos!",
  "poisonHeal": "{{abilityName}} de {{pokemonName}}\nrestaurou seus PS um pouco!",
  "trace": "{{pokemonName}} copied {{targetName}}'s\n{{abilityName}}!",
  "windPowerCharged": "Ser atingido por {{moveName}} carregou {{pokemonName}} com poder!",
} as const;
