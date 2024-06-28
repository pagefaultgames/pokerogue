import { StatusEffectTranslationEntries } from "#app/interfaces/locales.js";

export const statusEffect: StatusEffectTranslationEntries = {
  none: {
    name: "Ninguno",
    description: "",
    obtain: "",
    obtainSource: "",
    activation: "",
    overlap: "",
    heal: ""
  },
  poison: {
    name: "Envenenamiento",
    description: "envenenado ",
    obtain: "¡{{pokemonNameWithAffix}}\nha sido envenenado!",
    obtainSource: "¡{{pokemonNameWithAffix}}\nha sido envenenado por {{sourceText}}!",
    activation: "¡{{pokemonNameWithAffix}} se hizo daño\npor el veneno!",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá envenenado!",
    heal: "¡{{pokemonNameWithAffix}} se\ncuró del envenenamiento!"
  },
  toxic: {
    name: "Envenenado grave",
    description: "envenenado grave",
    obtain: "¡{{pokemonNameWithAffix}}\nha sido gravemente envenenado!",
    obtainSource: "¡{{pokemonNameWithAffix}}\nha sido gravemente envenenado por {{sourceText}}!",
    activation: "¡{{pokemonNameWithAffix}} se hizo daño\npor el veneno!",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá envenenado!",
    heal: "¡{{pokemonNameWithAffix}} se\ncuró del envenenamiento!"
  },
  paralysis: {
    name: "Paralizado",
    description: "paralizado",
    obtain: "¡{{pokemonNameWithAffix}} sufre parálisis!\nQuizás no se pueda mover.",
    obtainSource: "¡{{pokemonNameWithAffix}} sufre parálisis por {{sourceText}}!\nQuizás no se pueda mover.",
    activation: "¡{{pokemonNameWithAffix}} está paralizado!\n¡No se puede mover!",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá paralizado!",
    heal: "¡{{pokemonNameWithAffix}} se\ncuró de la parálisis !"
  },
  sleep: {
    name: "Dormido",
    description: "dormido",
    obtain: "¡{{pokemonNameWithAffix}}\nse durmió!",
    obtainSource: "¡{{pokemonNameWithAffix}}\nse durmió por {{sourceText}}!",
    activation: "¡{{pokemonNameWithAffix}} está/ndormido como un tronco.",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá dormido!",
    heal: "¡{{pokemonNameWithAffix}} se despertó!"
  },
  freeze: {
    name: "Congelado",
    description: "congelado",
    obtain: "¡{{pokemonNameWithAffix}}\nha sido congelado!",
    obtainSource: "¡{{pokemonNameWithAffix}}\nha sido congelado por {{sourceText}}!",
    activation: "¡{{pokemonNameWithAffix}} está\ncongelado!",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá congelado!",
    heal: "¡{{pokemonNameWithAffix}} se\ndescongeló!"
  },
  burn: {
    name: "Quemado",
    description: "quemado",
    obtain: "¡{{pokemonNameWithAffix}}\nse ha quemado!",
    obtainSource: "¡{{pokemonNameWithAffix}}\nse ha quemado por {{sourceText}}!",
    activation: "¡{{pokemonNameWithAffix}} se hizo daño\npor el quemado!",
    overlap: "¡{{pokemonNameWithAffix}} ya\nestá quemado!",
    heal: "¡{{pokemonNameWithAffix}} se\ncuró del quemado!"
  },
} as const;
