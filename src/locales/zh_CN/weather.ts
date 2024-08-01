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
  "strongWindsEffectMessage": "The mysterious air current weakened the attack!",
  "strongWindsClearMessage": "神秘的乱流停止了。"
};

export const terrain: SimpleTranslationEntries = {
  "misty": "薄雾",
  "mistyStartMessage": "脚下雾气缭绕！",
  "mistyClearMessage": "脚下的雾气消失不见了！",
  "mistyBlockMessage": "{{pokemonNameWithAffix}}正受到薄雾场地的保护！",

  "electric": "电气",
  "electricStartMessage": "脚下电光飞闪！",
  "electricClearMessage": "脚下的电光消失不见了！",

  "grassy": "青草",
  "grassyStartMessage": "脚下青草如茵！",
  "grassyClearMessage": "脚下的青草消失不见了！",

  "psychic": "精神",
  "psychicStartMessage": "脚下传来了奇妙的感觉！",
  "psychicClearMessage": "脚下的奇妙感觉消失了！",

  "defaultBlockMessage": "{{pokemonNameWithAffix}}正受到{{terrainName}}的的保护！"
};
