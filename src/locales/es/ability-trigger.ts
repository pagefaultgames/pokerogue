import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "¡{{abilityName}} de {{pokemonName}}\nlo protegió del daño de retroceso!",
  "badDreams": "¡{{pokemonName}} está atormentado!",
  "costar": "{{pokemonName}} copied {{allyName}}'s stat changes!",
  "iceFaceAvoidedDamage": "¡{{pokemonNameWithAffix}} evitó\ndaño con {{abilityName}}!",
  "trace": "{{pokemonName}} rastreó {{abilityName}}\nde {{targetName}}!",
  "windPowerCharged": "¡{{pokemonName}} se ha cargado de electricidad gracias a {{moveName}}!",
  "quickDraw": "¡Gracias a la Garra Rápida, {{pokemonName}} puede tener prioridad!",
  "illusionBreak": "¡La ilusión de {{pokemonName}} se ha desvanecido!",
} as const;
