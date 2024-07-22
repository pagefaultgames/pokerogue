import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "A luz do sol ficou clara!",
  "sunnyLapseMessage": "A luz do sol está forte.",
  "sunnyClearMessage": "A luz do sol sumiu.",

  "rainStartMessage": "Começou a chover!",
  "rainLapseMessage": "A chuva continua forte.",
  "rainClearMessage": "A chuva parou.",

  "sandstormStartMessage": "Uma tempestade de areia se formou!",
  "sandstormLapseMessage": "A tempestade de areia é violenta.",
  "sandstormClearMessage": "A tempestade de areia diminuiu.",
  "sandstormDamageMessage": "{{pokemonNameWithAffix}} é atingido\npela tempestade de areia!",

  "hailStartMessage": "Começou a chover granizo!",
  "hailLapseMessage": "Granizo cai do céu.",
  "hailClearMessage": "O granizo parou.",
  "hailDamageMessage": "{{pokemonNameWithAffix}} é atingido\npelo granizo!",

  "snowStartMessage": "Começou a nevar!",
  "snowLapseMessage": "A neve continua caindo.",
  "snowClearMessage": "Parou de nevar.",

  "fogStartMessage": "Uma névoa densa se formou!",
  "fogLapseMessage": "A névoa continua forte.",
  "fogClearMessage": "A névoa sumiu.",

  "heavyRainStartMessage": "Um temporal começou!",
  "heavyRainLapseMessage": "O temporal continua forte.",
  "heavyRainClearMessage": "O temporal parou.",

  "harshSunStartMessage": "A luz do sol está escaldante!",
  "harshSunLapseMessage": "A luz do sol é intensa.",
  "harshSunClearMessage": "A luz do sol enfraqueceu.",

  "strongWindsStartMessage": "Ventos fortes apareceram!",
  "strongWindsLapseMessage": "Os ventos fortes continuam.",
  "strongWindsEffectMessage": "The mysterious air current weakened the attack!",
  "strongWindsClearMessage": "Os ventos fortes diminuíram.",
};

export const terrain: SimpleTranslationEntries = {
  "misty": "Enevoado",
  "mistyStartMessage": "Uma névoa se espalhou pelo campo de batalha!",
  "mistyClearMessage": "A névou sumiu do campo de batalha.",
  "mistyBlockMessage": "{{pokemonNameWithAffix}} se envolveu com uma névoa protetora!",

  "electric": "Elétrico",
  "electricStartMessage": "Uma corrente elétrica se espalhou pelo campo de batalha!",
  "electricClearMessage": "A eletricidade sumiu do campo de batalha.",

  "grassy": "de Plantas",
  "grassyStartMessage": "Grama cresceu para cobrir o campo de batalha!",
  "grassyClearMessage": "A grama sumiu do campo de batalha.",

  "psychic": "Psíquico",
  "psychicStartMessage": "O campo de batalha ficou esquisito!",
  "psychicClearMessage": "A esquisitice sumiu do campo de batalha",

  "defaultBlockMessage": "{{pokemonNameWithAffix}} está protegido pelo Terreno {{terrainName}}!"
};
