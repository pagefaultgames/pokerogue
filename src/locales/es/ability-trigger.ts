import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "¡{{abilityName}} de {{pokemonName}}\nlo protegió del daño de retroceso!",
  "badDreams": "¡{{pokemonName}} está atormentado!",
  "costar": "¡{{pokemonName}} ha copiado los cambios\nen las características de {{allyName}}!",
  "iceFaceAvoidedDamage": "¡{{pokemonNameWithAffix}} evitó\ndaño con {{abilityName}}!",
  "trace": "¡Se ha copiado la habilidad {{abilityName}}\ndel {{targetName}}!",
  "windPowerCharged": "¡{{pokemonName}} se ha cargado de electricidad gracias a {{moveName}}!",
  "quickDraw": "¡{{pokemonName}} se mueve primero gracias a la Garra Rápida!",
} as const;
