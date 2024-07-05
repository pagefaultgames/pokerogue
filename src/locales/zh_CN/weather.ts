import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "日照变强了！",
  "sunnyLapseMessage": "日照很强。",
  "sunnyClearMessage": "日照复原了。",

  "rainStartMessage": "开始下雨了！",
  "rainLapseMessage": "雨继续下。",
  "rainClearMessage": "雨停了。",

  "sandstormStartMessage": "开始刮沙暴了！",
  "sandstormLapseMessage": "沙暴肆虐。",
  "sandstormClearMessage": "沙暴停止了！",
  "sandstormDamageMessage": "沙暴袭击了{{pokemonNameWithAffix}}！",

  "hailStartMessage": "开始下冰雹了！",
  "hailLapseMessage": "冰雹继续肆虐。",
  "hailClearMessage": "冰雹不再下了。",
  "hailDamageMessage": "冰雹袭击了{{pokemonNameWithAffix}}！",

  "snowStartMessage": "开始下雪了！",
  "snowLapseMessage": "雪继续下。",
  "snowClearMessage": "雪停了。",

  "fogStartMessage": "起雾了！",
  "fogLapseMessage": "雾很浓。",
  "fogClearMessage": "雾散了。",

  "heavyRainStartMessage": "开始下起了暴雨！",
  "heavyRainLapseMessage": "暴雨势头不减。",
  "heavyRainClearMessage": "暴雨停了。",

  "harshSunStartMessage": "日照变得非常强了！",
  "harshSunLapseMessage": "强日照势头不减。",
  "harshSunClearMessage": "日照复原了。",

  "strongWindsStartMessage": "吹起了神秘的乱流！",
  "strongWindsLapseMessage": "神秘的乱流势头不减。",
  "strongWindsClearMessage": "神秘的乱流停止了。"
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
