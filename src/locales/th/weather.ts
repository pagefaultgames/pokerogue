import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "แสงแดดสว่างสดใส!",
  "sunnyLapseMessage": "แสงแดดมีแรงมาก",
  "sunnyClearMessage": "แสงแดดจางหายไป",

  "rainStartMessage": "ฝนตกหนัก!",
  "rainLapseMessage": "ฝนตกต่อเนื่อง",
  "rainClearMessage": "ฝนหยุดตก",

  "sandstormStartMessage": "พายุทรายรุนแรง!",
  "sandstormLapseMessage": "พายุทรายกำลังรุนแรง",
  "sandstormClearMessage": "พายุทรายหยุดลง",
  "sandstormDamageMessage": "{{pokemonNameWithAffix}} ได้รับความเสียหายจากพายุทราย!",

  "hailStartMessage": "เริ่มตกหิมะ!",
  "hailLapseMessage": "หิมะยังตกอยู่",
  "hailClearMessage": "หิมะหยุดตก",
  "hailDamageMessage": "{{pokemonNameWithAffix}} ได้รับความเสียหายจากลูกเห็บ!",

  "snowStartMessage": "เริ่มตกหิ!",
  "snowLapseMessage": "หิมะกำลังตก",
  "snowClearMessage": "หิมะหยุดตก",

  "fogStartMessage": "หมอกหนาปกคลุม!",
  "fogLapseMessage": "หมอกยังคงปกคลุม",
  "fogClearMessage": "หมอกหายไป",

  "heavyRainStartMessage": "ฝนตกหนักมาก!",
  "heavyRainLapseMessage": "ฝนตกหนักยังคงตกอยู่",
  "heavyRainClearMessage": "ฝนหยุดตกหนัก",

  "harshSunStartMessage": "แสงแดดร้อนแรงขึ้น!",
  "harshSunLapseMessage": "แสงแดดร้อนจัด",
  "harshSunClearMessage": "แสงแดดร้อนจางหายไป",

  "strongWindsStartMessage": "ลมแรงเริ่มพัด!",
  "strongWindsLapseMessage": "ลมพัดอย่างแรง",
  "strongWindsClearMessage": "ลมแรงหยุดพัด"
};
