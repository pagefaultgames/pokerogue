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
    name: "Poison",
    description: "poisoning",
    obtain: "{{pokemonNameWithAffix}}\nwas poisoned!",
    obtainSource: "{{pokemonNameWithAffix}}\nwas poisoned by {{sourceText}}!",
    activation: "{{pokemonNameWithAffix}} is hurt\nby poison!",
    overlap: "{{pokemonNameWithAffix}} is\nalready poisoned!",
    heal: "{{pokemonNameWithAffix}} was\ncured of its poison!"
  },
  toxic: {
    name: "Toxic",
    description: "poisoning",
    obtain: "{{pokemonNameWithAffix}}\nwas badly poisoned!",
    obtainSource: "{{pokemonNameWithAffix}}\nwas badly poisoned by {{sourceText}}!",
    activation: "{{pokemonNameWithAffix}} is hurt\nby poison!",
    overlap: "{{pokemonNameWithAffix}} is\nalready poisoned!",
    heal: "{{pokemonNameWithAffix}} was\ncured of its poison!"
  },
  paralysis: {
    name: "Paralysis",
    description: "paralysis",
    obtain: "{{pokemonNameWithAffix}} was paralyzed,\nIt may be unable to move!",
    obtainSource: "{{pokemonNameWithAffix}} was paralyzed by {{sourceText}}!\nIt may be unable to move!",
    activation: "{{pokemonNameWithAffix}} is paralyzed!\nIt can't move!",
    overlap: "{{pokemonNameWithAffix}} is\nalready paralyzed!",
    heal: "{{pokemonNameWithAffix}} was\nhealed of paralysis!"
  },
  sleep: {
    name: "Sleep",
    description: "sleep",
    obtain: "{{pokemonNameWithAffix}}\nfell asleep!",
    obtainSource: "{{pokemonNameWithAffix}}\nfell asleep from {{sourceText}}!",
    activation: "{{pokemonNameWithAffix}} is fast asleep.",
    overlap: "{{pokemonNameWithAffix}} is\nalready asleep!",
    heal: "{{pokemonNameWithAffix}} woke up!"
  },
  freeze: {
    name: "Freeze",
    description: "freezing",
    obtain: "{{pokemonNameWithAffix}}\nwas frozen solid!",
    obtainSource: "{{pokemonNameWithAffix}}\nwas frozen solid by {{sourceText}}!",
    activation: "{{pokemonNameWithAffix}} is\nfrozen solid!",
    overlap: "{{pokemonNameWithAffix}} is\nalready frozen!",
    heal: "{{pokemonNameWithAffix}} was\ndefrosted!"
  },
  burn: {
    name: "Burn",
    description: "burn",
    obtain: "{{pokemonNameWithAffix}}\nwas burned!",
    obtainSource: "{{pokemonNameWithAffix}}\nwas burned by {{sourceText}}!",
    activation: "{{pokemonNameWithAffix}} is hurt\nby its burn!",
    overlap: "{{pokemonNameWithAffix}} is\nalready burned!",
    heal: "{{pokemonNameWithAffix}} was\nhealed of its burn!"
  },
} as const;
