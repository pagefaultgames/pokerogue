import { StatusEffectTranslationEntries } from "#app/interfaces/locales.js";

export const statusEffect: StatusEffectTranslationEntries = {
  none: {
    name: "なし",
    description: "",
    obtain: "",
    obtainSource: "",
    activation: "",
    overlap: "",
    heal: ""
  },
  poison: {
    name: "どく",
    description: "どく",
    obtain: "{{pokemonNameWithAffix}}は\n毒を　あびた！",
    obtainSource: "{{pokemonNameWithAffix}}は\n{{sourceText}}で　毒を　あびた！",
    activation: "{{pokemonNameWithAffix}}は\n毒の　ダメージを　受けた！",
    overlap: "{{pokemonNameWithAffix}}は　すでに\n毒を　あびている",
    heal: "{{pokemonNameWithAffix}}の　毒は\nきれいさっぱり　なくなった！"
  },
  toxic: {
    name: "もうどく",
    description: "もうどく",
    obtain: "{{pokemonNameWithAffix}}は\n猛毒を　あびた！",
    obtainSource: "{{pokemonNameWithAffix}}は\n{{sourceText}}で　猛毒を　あびた！",
    activation: "{{pokemonNameWithAffix}}は\n毒の　ダメージを受けた！",
    overlap: "{{pokemonNameWithAffix}}は　すでに\n毒を　あびている",
    heal: "{{pokemonNameWithAffix}}の　毒は\nきれいさっぱり　なくなった！"
  },
  paralysis: {
    name: "まひ",
    description: "まひ",
    obtain: "{{pokemonNameWithAffix}}は　まひして\n技が　でにくくなった！",
    obtainSource: "{{pokemonNameWithAffix}}は　{{sourceText}}で　まひして\n技が　でにくくなった！",
    activation: "{{pokemonNameWithAffix}}は\n体が　しびれて　動けない！",
    overlap: "{{pokemonNameWithAffix}}は\nすでに　まひしている",
    heal: "{{pokemonNameWithAffix}}の\nしびれが　とれた！"
  },
  sleep: {
    name: "ねむり",
    description: "ねむり",
    obtain: "{{pokemonNameWithAffix}}は\n眠ってしまった！",
    obtainSource: "{{pokemonNameWithAffix}}は\n{{sourceText}}で　眠ってしまった！",
    activation: "{{pokemonNameWithAffix}}は\nぐうぐう　眠っている",
    overlap: "{{pokemonNameWithAffix}}は\nすでに　眠っている",
    heal: "{{pokemonNameWithAffix}}は\n目を　覚ました！"
  },
  freeze: {
    name: "こおり",
    description: "こおり",
    obtain: "{{pokemonNameWithAffix}}は\n凍りついた！",
    obtainSource: "{{pokemonNameWithAffix}}は\n{{sourceText}}で　凍りついた！",
    activation: "{{pokemonNameWithAffix}}は\n凍ってしまって　動けない！",
    overlap: "{{pokemonNameWithAffix}}は\nすでに　凍っている",
    heal: "{{pokemonNameWithAffix}}は\nこおり状態が　治った！"
  },
  burn: {
    name: "やけど",
    description: "やけど",
    obtain: "{{pokemonNameWithAffix}}は\nやけどを　負った！",
    obtainSource: "{{pokemonNameWithAffix}}は\n{{sourceText}}で　やけどを　負った！",
    activation: "{{pokemonNameWithAffix}}は\nやけどの　ダメージを　受けた！",
    overlap: "{{pokemonNameWithAffix}}は　すでに\nやけどを　負っている",
    heal: "{{pokemonNameWithAffix}}の\nやけどが　治った！"
  },
} as const;
