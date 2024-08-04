import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "The sunlight got bright!",
  "sunnyLapseMessage": "The sunlight is strong.",
  "sunnyClearMessage": "The sunlight faded.",

  "rainStartMessage": "A downpour started!",
  "rainLapseMessage": "The downpour continues.",
  "rainClearMessage": "The rain stopped.",

  "sandstormStartMessage": "A sandstorm brewed!",
  "sandstormLapseMessage": "The sandstorm rages.",
  "sandstormClearMessage": "The sandstorm subsided.",
  "sandstormDamageMessage": "{{pokemonNameWithAffix}} is buffeted\nby the sandstorm!",

  "hailStartMessage": "It started to hail!",
  "hailLapseMessage": "Hail continues to fall.",
  "hailClearMessage": "The hail stopped.",
  "hailDamageMessage": "{{pokemonNameWithAffix}} is pelted\nby the hail!",

  "snowStartMessage": "It started to snow!",
  "snowLapseMessage": "The snow is falling down.",
  "snowClearMessage": "The snow stopped.",

  "fogStartMessage": "A thick fog emerged!",
  "fogLapseMessage": "The fog continues.",
  "fogClearMessage": "The fog disappeared.",

  "heavyRainStartMessage": "A heavy downpour started!",
  "heavyRainLapseMessage": "The heavy downpour continues.",
  "heavyRainClearMessage": "The heavy rain stopped.",

  "harshSunStartMessage": "The sunlight got hot!",
  "harshSunLapseMessage": "The sun is scorching hot.",
  "harshSunClearMessage": "The harsh sunlight faded.",

  "strongWindsStartMessage": "A heavy wind began!",
  "strongWindsLapseMessage": "The wind blows intensely.",
  "strongWindsEffectMessage": "The mysterious air current weakened the attack!",
  "strongWindsClearMessage": "The heavy wind stopped."
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
