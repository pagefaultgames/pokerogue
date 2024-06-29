import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "¡{{abilityName}} de {{pokemonName}}\nlo protegió del daño de retroceso!",
  "badDreams": "¡{{pokemonName}} está atormentado!",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "¡{{pokemonNameWithAffix}} evitó\ndaño con {{abilityName}}!",
  "trace": "¡{{pokemonName}} ha copiado la habilidad {{abilityName}} \nde {{targetName}}!",
  "windPowerCharged": "¡{{pokemonName}} se ha cargado de electricidad gracias a {{moveName}}!",
  "quickDraw": "¡{{pokemonName}} ataca primero gracias a la habilidad Mano Rápida!",
  "disguiseAvoidedDamage" : "¡El disfraz de {{pokemonName}} se ha roto!",
} as const;
