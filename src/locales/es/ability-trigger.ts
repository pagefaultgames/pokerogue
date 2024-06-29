import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "¡{{abilityName}} de {{pokemonName}}\nlo protegió del daño de retroceso!",
  "badDreams": "¡{{pokemonName}} está atormentado!",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "¡{{pokemonNameWithAffix}} evitó\ndaño con {{abilityName}}!",
  "trace": "{{pokemonName}} copied {{targetName}}'s\n{{abilityName}}!",
  "windPowerCharged": "¡{{pokemonName}} se ha cargado de electricidad gracias a {{moveName}}!",
  "quickDraw": "{{pokemonName}} can act faster than normal, thanks to its Quick Draw!",
} as const;
