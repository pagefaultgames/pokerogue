import { SimpleTranslationEntries } from "#app/interfaces/locales";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "日差しが　強くなった！",
  "sunnyLapseMessage": "日差しが　強い！",
  "sunnyClearMessage": "日差しが　元に戻った！",

  "rainStartMessage": "雨が　降り始めた！",
  "rainLapseMessage": "雨が　降っている！",
  "rainClearMessage": "雨が　あがった！",

  "sandstormStartMessage": "砂あらしが　吹き始めた！",
  "sandstormLapseMessage": "砂あらしが　吹きあれる！",
  "sandstormClearMessage": "砂あらしが　おさまった！",
  "sandstormDamageMessage": "砂あらしが\n{{pokemonNameWithAffix}}を　襲う！",

  "hailStartMessage": "あられが　降り始めた！",
  "hailLapseMessage": "あられが　降っている！",
  "hailClearMessage": "あられが　止んだ！",
  "hailDamageMessage": "あられが\n{{pokemonNameWithAffix}}を　襲う！",

  "snowStartMessage": "雪が　降り始めた！",
  "snowLapseMessage": "雪が　降っている！",
  "snowClearMessage": "雪が　止んだ！",

  "fogStartMessage": "足下に　霧(きり)が立ち込めた！",
  "fogLapseMessage": "足下に　霧(きり)が　立ち込めている！",
  "fogClearMessage": "足下の　霧(きり)が消え去った！",

  "heavyRainStartMessage": "強い雨が　降り始めた！",
  "heavyRainLapseMessage": "強い雨が　降っている！",
  "heavyRainClearMessage": "強い雨が　あがった！",

  "harshSunStartMessage": "日差しが　とても強くなった！",
  "harshSunLapseMessage": "日差しが　とても強い！",
  "harshSunClearMessage": "日差しが　元に戻った！",

  "strongWindsStartMessage": "謎(なぞ)の　乱気流(らんきりゅう)が\nひこうポケモンを　護(まも)る！",
  "strongWindsLapseMessage": "謎(なぞ)の　乱気流(らんきりゅう)の　勢(いきお)いは　止まらない！",
  "strongWindsEffectMessage": "謎(なぞ)の　乱気流(らんきりゅう)が　攻撃(こうげき)を　弱(よわ)めた！",
  "strongWindsClearMessage": "謎(なぞ)の　乱気流(らんきりゅう)が　おさまった！"
};

export const terrain: SimpleTranslationEntries = {
  "misty": "ミストフィールド",
  "mistyStartMessage": "足下に　霧(きり)が立ち込めた！",
  "mistyClearMessage": "足下の　霧(きり)が消え去った！",
  "mistyBlockMessage": "{{pokemonNameWithAffix}}は\nミストフィールドに　守られている！",

  "electric": "エレキフィールド",
  "electricStartMessage": "足下に　電気が　かけめぐる！",
  "electricClearMessage": "足下の　電気が　消え去った！",

  "grassy": "グラスフィールド",
  "grassyStartMessage": "足下に　草がおいしげった！",
  "grassyClearMessage": "足下の　草が消え去った！",

  "psychic": "サイコフィールド",
  "psychicStartMessage": "足元が　不思議な感じに　なった！",
  "psychicClearMessage": "足元の　不思議感が　消え去った！",

  "defaultBlockMessage": "{{pokemonNameWithAffix}}は\n{{terrainName}}に　守られている！"
};
