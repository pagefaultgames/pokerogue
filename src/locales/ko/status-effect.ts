import { StatusEffectTranslationEntries } from "#app/interfaces/locales.js";

export const statusEffect: StatusEffectTranslationEntries = {
  none: {
    name: "없음",
    description: "",
    obtain: "",
    obtainSource: "",
    activation: "",
    overlap: "",
    heal: ""
  },
  poison: {
    name: "독",
    description: "독",
    obtain: "{{pokemonNameWithAffix}}의\n몸에 독이 퍼졌다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]]\n{{sourceText}} 때문에 몸에 독이 퍼졌다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n독에 의한 데미지를 입었다!",
    overlap: "{{pokemonNameWithAffix}}[[는]] 이미\n몸에 독이 퍼진 상태다.",
    heal: "{{pokemonNameWithAffix}}의 독은\n말끔하게 해독됐다!"
  },
  toxic: {
    name: "맹독",
    description: "독",
    obtain: "{{pokemonNameWithAffix}}의\n몸에 맹독이 퍼졌다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]]\n{{sourceText}} 때문에 몸에 맹독이 퍼졌다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n독에 의한 데미지를 입었다!",
    overlap: "{{pokemonNameWithAffix}}[[는]] 이미\n몸에 독이 퍼진 상태다.",
    heal: "{{pokemonNameWithAffix}}의 독은\n말끔하게 해독됐다!"
  },
  paralysis: {
    name: "마비",
    description: "마비",
    obtain: "{{pokemonNameWithAffix}}[[는]] 마비되어\n기술이 나오기 어려워졌다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]] {{sourceText}} 때문에\n마비되어 기술이 나오기 어려워졌다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n몸이 저려서 움직일 수 없다!",
    overlap: "{{pokemonNameWithAffix}}[[는]]\n이미 마비되어 있다!",
    heal: "{{pokemonNameWithAffix}}의\n몸저림이 풀렸다!"
  },
  sleep: {
    name: "잠듦",
    description: "잠듦",
    obtain: "{{pokemonNameWithAffix}}[[는]]\n잠들어 버렸다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]]\n{{sourceText}} 때문에 잠들어 버렸다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n쿨쿨 잠들어 있다.",
    overlap: "{{pokemonNameWithAffix}}[[는]]\n이미 잠들어 있다.",
    heal: "{{pokemonNameWithAffix}}[[는]]\n눈을 떴다!"
  },
  freeze: {
    name: "얼음",
    description: "얼음",
    obtain: "{{pokemonNameWithAffix}}[[는]]\n얼어붙었다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]]\n{{sourceText}} 때문에 얼어붙었다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n얼어 버려서 움직일 수 없다!",
    overlap: "{{pokemonNameWithAffix}}[[는]]\n이미 얼어 있다.",
    heal: "{{pokemonNameWithAffix}}의\n얼음 상태가 나았다!"
  },
  burn: {
    name: "화상",
    description: "화상",
    obtain: "{{pokemonNameWithAffix}}[[는]]\n화상을 입었다!",
    obtainSource: "{{pokemonNameWithAffix}}[[는]]\n{{sourceText}} 때문에 화상을 입었다!",
    activation: "{{pokemonNameWithAffix}}[[는]]\n화상 데미지를 입었다!",
    overlap: "{{pokemonNameWithAffix}}[[는]] 이미\n화상을 입은 상태다.",
    heal: "{{pokemonNameWithAffix}}의\n화상이 나았다!"
  },
} as const;
