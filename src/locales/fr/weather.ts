import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "Les rayons du soleil brillent !",
  "sunnyLapseMessage": "Les rayons du soleil brillent fort !",
  "sunnyClearMessage": "Les rayons du soleil s’affaiblissent !",

  "rainStartMessage": "Il commence à pleuvoir !",
  "rainLapseMessage": "La pluie continue de tomber !",
  "rainClearMessage": "La pluie s’est arrêtée !",

  "sandstormStartMessage": "Une tempête de sable se prépare !",
  "sandstormLapseMessage": "La tempête de sable fait rage !",
  "sandstormClearMessage": "La tempête de sable se calme !",
  "sandstormDamageMessage": "La tempête de sable inflige des dégâts\nà {{pokemonNameWithAffix}} !",

  "hailStartMessage": "Il commence à grêler !",
  "hailLapseMessage": "La grêle continue de tomber !",
  "hailClearMessage": "La grêle s’est arrêtée !",
  "hailDamageMessage": "La grêle inflige des dégâts\nà {{pokemonNameWithAffix}} !",

  "snowStartMessage": "Il commence à neiger !",
  "snowLapseMessage": "Il y a une tempête de neige !",
  "snowClearMessage": "La neige s’est arrêtée !",

  "fogStartMessage": "Le brouillard devient épais…",
  "fogLapseMessage": "Le brouillard continue !",
  "fogClearMessage": "Le brouillard s’est dissipé !",

  "heavyRainStartMessage": "Une pluie battante s’abat soudainement !",
  "heavyRainLapseMessage": "La pluie battante continue.",
  "heavyRainClearMessage": "La pluie battante s’est arrêtée…",

  "harshSunStartMessage": "Les rayons du soleil s’intensifient !",
  "harshSunLapseMessage": "Les rayons du soleil sont brulants !",
  "harshSunClearMessage": "Les rayons du soleil s’affaiblissent !",

  "strongWindsStartMessage": "Un vent mystérieux se lève !",
  "strongWindsLapseMessage": "Le vent mystérieux souffle violemment !",
  "strongWindsClearMessage": "Le vent mystérieux s’est dissipé…"
};

export const terrain: SimpleTranslationEntries = {
  "misty": "Misty",
  "mistyStartMessage": "Mist swirled around the battlefield!",
  "mistyClearMessage": "The mist disappeared from the battlefield.",
  "mistyBlockMessage": "{{pokemonNameWithAffix}} surrounds itself with a protective mist!",

  "electric": "Electric",
  "electricStartMessage": "An electric current ran across the battlefield!",
  "electricClearMessage": "The electricity disappeared from the battlefield.",

  "grassy": "Grassy",
  "grassyStartMessage": "Grass grew to cover the battlefield!",
  "grassyClearMessage": "The grass disappeared from the battlefield.",

  "psychic": "Psychic",
  "psychicStartMessage": "The battlefield got weird!",
  "psychicClearMessage": "The weirdness disappeared from the battlefield!",

  "defaultBlockMessage": "{{pokemonNameWithAffix}} is protected by the {{terrainName}} Terrain!"
};
