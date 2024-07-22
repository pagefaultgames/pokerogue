import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}} di {{pokemonName}}\nl'ha protetto dal contraccolpo!",
  "badDreams": "{{pokemonName}} è tormentato dagli incubi!",
  "costar": "{{pokemonName}} ha copiato le modifiche alle statistiche\ndel suo alleato {{allyName}}!",
  "iceFaceAvoidedDamage": "{{pokemonName}} ha evitato\ni danni grazie a {{abilityName}}!",
  "trace": "L'abilità {{abilityName}} di {{targetName}}\nviene copiata da {{pokemonName}} con Traccia!",
  "windPowerCharged": "Venire colpito da {{moveName}} ha caricato {{pokemonName}}!",
  "quickDraw":"{{pokemonName}} agisce più rapidamente del normale grazie a Colpolesto!",
} as const;
