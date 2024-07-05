import { StatusEffectTranslationEntries } from "#app/interfaces/locales.js";

export const statusEffect: StatusEffectTranslationEntries = {
  none: {
    name: "None",
    description: "",
    obtain: "",
    obtainSource: "",
    activation: "",
    overlap: "",
    heal: ""
  },
  poison: {
    name: "Gift",
    description: "Vergiftungen",
    obtain: "{{pokemonNameWithAffix}} wurde vergiftet!",
    obtainSource: "{{pokemonNameWithAffix}} wurde durch {{sourceText}} vergiftet!",
    activation: "{{pokemonNameWithAffix}} wird durch Gift verletzt!",
    overlap: "{{pokemonNameWithAffix}} ist bereits vergiftet!",
    heal: "Die Vergiftung von {{pokemonNameWithAffix}} wurde geheilt!"
  },
  toxic: {
    name: "Gift",
    description: "Vergiftungen",
    obtain: "{{pokemonNameWithAffix}} wurde schwer vergiftet!",
    obtainSource: "{{pokemonNameWithAffix}} wurde durch  {{sourceText}} schwer vergiftet!",
    activation: "{{pokemonNameWithAffix}} wird durch Gift verletzt!",
    overlap: "{{pokemonNameWithAffix}} ist bereits vergiftet!",
    heal: "Die Vergiftung von {{pokemonNameWithAffix}} wurde geheilt!"
  },
  paralysis: {
    name: "Paralyse",
    description: "Paralyse",
    obtain: "{{pokemonNameWithAffix}} wurde paralysiert!\nEs kann eventuell nicht handeln!",
    obtainSource: "{{pokemonNameWithAffix}} wurde durch {{sourceText}} paralysiert,\nEs kann eventuell nicht handeln!",
    activation: "{{pokemonNameWithAffix}}ist paralysiert!\nEs kann nicht angreifen!",
    overlap: "{{pokemonNameWithAffix}} ist bereits paralysiert!",
    heal: "Die Paralyse von {{pokemonNameWithAffix}} wurde aufgehoben!"
  },
  sleep: {
    name: "Schlaf",
    description: "Einschlafen",
    obtain: "{{pokemonNameWithAffix}} ist eingeschlafen!",
    obtainSource: "{{pokemonNameWithAffix}}ist durch {{sourceText}} eingeschlafen!",
    activation: "{{pokemonNameWithAffix}} schläft tief und fest!",
    overlap: "{{pokemonNameWithAffix}} schläft bereits!",
    heal: "{{pokemonNameWithAffix}} ist aufgewacht!"
  },
  freeze: {
    name: "Gefroren",
    description: "Einfrieren",
    obtain: "{{pokemonNameWithAffix}} erstarrt zu Eis!",
    obtainSource: "{{pokemonNameWithAffix}} erstarrt durch  {{sourceText}} zu Eis!",
    activation: "{{pokemonNameWithAffix}} ist eingefroren und kann nicht handeln!",
    overlap: "{{pokemonNameWithAffix}} ist bereits eingefroren!",
    heal: "{{pokemonNameWithAffix}} wurde aufgetaut!"
  },
  burn: {
    name: "Verbrennung ",
    description: "Verbrennungen",
    obtain: "{{pokemonNameWithAffix}} erleidet Verbrennungen!",
    obtainSource: "{{pokemonNameWithAffix}} erleidet durch {{sourceText}} Verbrennungen!",
    activation: "Die Verbrennungen schaden {{pokemonNameWithAffix}}!",
    overlap: "{{pokemonNameWithAffix}} leidet bereits unter Verbrennungen!",
    heal: "Die Verbrennungen von {{pokemonNameWithAffix}}  wurden geheilt!"
  },
} as const;
