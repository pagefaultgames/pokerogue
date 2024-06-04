import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "햇살이 강해졌다!",
  "sunnyLapseMessage": "햇살이 강하다",
  "sunnyClearMessage": "햇살이 원래대로 되돌아왔다!",

  "rainStartMessage": "비가 내리기 시작했다!",
  "rainLapseMessage": "비가 계속 내리고 있다",
  "rainClearMessage": "비가 그쳤다!",

  "sandstormStartMessage": "모래바람이 불기 시작했다!",
  "sandstormLapseMessage": "모래바람이 세차게 분다",
  "sandstormClearMessage": "모래바람이 가라앉았다!",
  "sandstormDamageMessage": "모래바람이\n{{pokemonPrefix}}{{pokemonName}}[[를]] 덮쳤다!",

  "hailStartMessage": "싸라기눈이 내리기 시작했다!",
  "hailLapseMessage": "싸라기눈이 계속 내리고 있다",
  "hailClearMessage": "싸라기눈이 그쳤다!",
  "hailDamageMessage": "싸라기눈이\n{{pokemonPrefix}}{{pokemonName}}[[를]] 덮쳤다!",

  "snowStartMessage": "눈이 내리기 시작했다!",
  "snowLapseMessage": "눈이 계속 내리고 있다",
  "snowClearMessage": "눈이 그쳤다!",

  // 이하 LapseMessage 임의번역
  "fogStartMessage": "발밑이 안개로 자욱해졌다!",
  "fogLapseMessage": "발밑이 안개로 자욱하다",
  "fogClearMessage": "발밑의 안개가 사라졌다!",

  "heavyRainStartMessage": "강한 비가 내리기 시작했다!",
  "heavyRainLapseMessage": "강한 비가 계속 내리고 있다",
  "heavyRainClearMessage": "강한 비가 그쳤다!",

  "harshSunStartMessage": "햇살이 아주 강해졌다!",
  "harshSunLapseMessage": "햇살이 아주 강하다",
  "harshSunClearMessage": "햇살이 원래대로 되돌아왔다!",

  "strongWindsStartMessage": "수수께끼의 난기류가\n비행포켓몬을 지킨다!",
  "strongWindsLapseMessage": "수수께끼의 난기류가 강렬하게 불고 있다",
  "strongWindsClearMessage": "수수께끼의 난기류가 멈췄다!" // 임의번역
};
