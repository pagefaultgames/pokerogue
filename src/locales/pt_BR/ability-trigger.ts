import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!",
  "badDreams": "{{pokemonName}} está tendo pesadelos!",
  "costar": "{{pokemonName}} copiou as mudanças\nde atributo de {{allyName}}!",
  "iceFaceAvoidedDamage": "{{pokemonName}} evitou\ndanos com sua {{abilityName}}!",
  "perishBody": "{{abilityName}} de {{pokemonName}}\nirá desmaiar ambos os Pokémon em 3 turnos!",
  "poisonHeal": "{{abilityName}} de {{pokemonName}}\nrestaurou seus PS um pouco!",
  "trace": "{{pokemonName}} copiou {{abilityName}}\nde {{targetName}}!",
  "windPowerCharged": "Ser atingido por {{moveName}} carregou {{pokemonName}} com poder!",
  "quickDraw":"{{pokemonName}} can act faster than normal, thanks to its Quick Draw!",
} as const;
