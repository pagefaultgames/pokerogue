import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
    "sunnyStartMessage": "日照变强了！",
    "sunnyLapseMessage": "日照很强。",
    "sunnyClearMessage": "日照复原了！",

    "rainStartMessage": "开始下雨了！",
    "rainLapseMessage": "雨继续下。",
    "rainClearMessage": "雨停了。",

    "sandstormStartMessage": "开始刮沙暴了！",
    "sandstormLapseMessage": "沙暴肆虐。",
    "sandstormClearMessage": "沙暴停止了！",
    "sandstormDamageMessage": "{{pokemonPrefix}}{{pokemonName}} 被沙暴\n吹得东倒西歪！",

    "hailStartMessage": "开始下冰雹了！",
    "hailLapseMessage": "冰雹继续肆虐。",
    "hailClearMessage": "冰雹不下了！",
    "hailDamageMessage": "{{pokemonPrefix}}{{pokemonName}} 被冰雹\n打得七零八落！",

    "snowStartMessage": "开始下雪了！",
    "snowLapseMessage": "雪花纷纷扬扬地飘落。",
    "snowClearMessage": "雪停了。",

    "fogStartMessage": "大雾出现了！",
    "fogLapseMessage": "雾很浓。",
    "fogClearMessage": "雾气消散了。",

    "heavyRainStartMessage": "开始下起了暴雨！",
    "heavyRainLapseMessage": "暴雨势头不减！",
    "heavyRainClearMessage": "暴雨停了。",
    
    "harshSunStartMessage": "日照变得非常强了！",
    "harshSunLapseMessage": "强日照势头不减！",
    "harshSunClearMessage": "日照复原了！",

    "strongWindsStartMessage": "乱流开始了！",
    "strongWindsLapseMessage": "风势猛烈。",
    "strongWindsClearMessage": "乱流停止了！"
}