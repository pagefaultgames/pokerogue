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
  "strongWindsEffectMessage": "Le courant aérien mystérieux affaiblit l’attaque !",
  "strongWindsClearMessage": "Le vent mystérieux s’est dissipé…"
};

export const terrain: SimpleTranslationEntries = {
  "misty": "Brumeux",
  "mistyStartMessage": "La brume recouvre le terrain !",
  "mistyClearMessage": "La brume qui recouvrait le terrain se dissipe…",
  "mistyBlockMessage": "La brume enveloppe {{pokemonNameWithAffix}} !",

  "electric": "Électrifié",
  "electricStartMessage": "De l’électricité parcourt le terrain !",
  "electricClearMessage": "L’électricité parcourant le terrain s’est dissipée…",

  "grassy": "Herbu",
  "grassyStartMessage": "Un beau gazon pousse sur le terrain !",
  "grassyClearMessage": "Le gazon disparait…",

  "psychic": "Psychique",
  "psychicStartMessage": "Le sol se met à réagir de façon bizarre…",
  "psychicClearMessage": "Le sol redevient normal !",

  "defaultBlockMessage": "{{pokemonNameWithAffix}} est protégé\npar le Champ {{terrainName}} !"
};
