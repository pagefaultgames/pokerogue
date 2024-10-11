import { SimpleTranslationEntries } from "#app/interfaces/locales";

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
  "sandstormDamageMessage": "모래바람이\n{{pokemonNameWithAffix}}[[를]] 덮쳤다!",

  "hailStartMessage": "싸라기눈이 내리기 시작했다!",
  "hailLapseMessage": "싸라기눈이 계속 내리고 있다",
  "hailClearMessage": "싸라기눈이 그쳤다!",
  "hailDamageMessage": "싸라기눈이\n{{pokemonNameWithAffix}}[[를]] 덮쳤다!",

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
  "strongWindsEffectMessage": "수수께끼의 난기류가 공격을 약하게 만들었다!",
  "strongWindsClearMessage": "수수께끼의 난기류가 멈췄다!" // 임의번역
};

export const terrain: SimpleTranslationEntries = {
  "misty": "미스트필드",
  "mistyStartMessage": "발밑이 안개로 자욱해졌다!",
  "mistyClearMessage": "발밑의 안개가 사라졌다!",
  "mistyBlockMessage": "{{pokemonNameWithAffix}}[[를]]\n미스트필드가 지켜주고 있다!",

  "electric": "일렉트릭필드",
  "electricStartMessage": "발밑에 전기가 흐르기 시작했다!",
  "electricClearMessage": "발밑의 전기가 사라졌다!",

  "grassy": "그래스필드",
  "grassyStartMessage": "발밑에 풀이 무성해졌다!",
  "grassyClearMessage": "발밑의 풀이 사라졌다!",

  "psychic": "사이코필드",
  "psychicStartMessage": "발밑에서 이상한 느낌이 든다!",
  "psychicClearMessage": "발밑의 이상한 느낌이 사라졌다!",

  "defaultBlockMessage": "{{pokemonNameWithAffix}}[[를]]\n{{terrainName}}[[가]] 지켜주고 있다!"
};
