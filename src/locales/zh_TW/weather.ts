import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "日照變強了！",
  "sunnyLapseMessage": "日照很強。",
  "sunnyClearMessage": "日照復原了。",

  "rainStartMessage": "下大雨了！",
  "rainLapseMessage": "雨繼續下。",
  "rainClearMessage": "雨停了。",

  "sandstormStartMessage": "開始刮沙暴了！",
  "sandstormLapseMessage": "沙暴肆虐。",
  "sandstormClearMessage": "沙暴停止了。",
  "sandstormDamageMessage": "沙暴襲擊了{{pokemonNameWithAffix}}！",

  "hailStartMessage": "開始下冰雹了！",
  "hailLapseMessage": "冰雹繼續肆虐。",
  "hailClearMessage": "冰雹不再下了。",
  "hailDamageMessage": "冰雹襲擊了{{pokemonNameWithAffix}}！",

  "snowStartMessage": "開始下雪了！",
  "snowLapseMessage": "雪繼續下。",
  "snowClearMessage": "雪停了。",

  "fogStartMessage": "起霧了！",
  "fogLapseMessage": "霧很濃。",
  "fogClearMessage": "霧散了。",

  "heavyRainStartMessage": "開始下起了暴雨！",
  "heavyRainLapseMessage": "暴雨勢頭不減。",
  "heavyRainClearMessage": "暴雨停了。",

  "harshSunStartMessage": "日照變得非常強了！",
  "harshSunLapseMessage": "強日照勢頭不減。",
  "harshSunClearMessage": "日照復原了。",

  "strongWindsStartMessage": "吹起了神秘的亂流！",
  "strongWindsLapseMessage": "神秘的亂流勢頭不減。",
  "strongWindsEffectMessage": "The mysterious air current weakened the attack!",
  "strongWindsClearMessage": "神秘的亂流停止了。"
};

export const terrain: SimpleTranslationEntries = {
  "misty": "薄霧",
  "mistyStartMessage": "腳下霧氣繚繞！",
  "mistyClearMessage": "腳下的霧氣消失不見了！",
  "mistyBlockMessage": "{{pokemonNameWithAffix}}正受到薄霧場地的保護！",

  "electric": "電氣",
  "electricStartMessage": "腳下電流飛閃！",
  "electricClearMessage": "腳下的電流消失了！",

  "grassy": "青草",
  "grassyStartMessage": "腳下青草如茵！",
  "grassyClearMessage": "腳下的青草消失不見了！",

  "psychic": "精神",
  "psychicStartMessage": "腳下傳來了奇妙的感覺！",
  "psychicClearMessage": "腳下的奇妙感覺消失了！",

  "defaultBlockMessage": "{{pokemonNameWithAffix}}正受到{{terrainName}}的保護！"
};
