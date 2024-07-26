export const delibirdyDialogue = {
  intro: "A pack of Delibird have appeared!",
  title: "Delibird-y",
  description: "The Delibirds are looking at you expectantly, as if they want something. Perhaps giving them an item or some money would satisfy them?",
  query: "What will you give them?",
  invalid_selection: "Pokémon doesn't have that kind of item.",
  option: {
    1: {
      label: "Give Money",
      tooltip: "(-) Give the Delibirds {{money, money}}\n(+) Receive a Gift Item",
      selected: `You toss the money to the Delibirds,\nwho chatter amongst themselves excitedly.
        $They turn back to you and happily give you a present!`,
    },
    2: {
      label: "Give Food",
      tooltip: "(-) Give the Delibirds a Berry or Reviver Seed\n(+) Receive a Gift Item",
      select_prompt: "Select an item to give.",
      selected: `You toss the {{chosenItem}} to the Delibirds,\nwho chatter amongst themselves excitedly.
        $They turn back to you and happily give you a present!`,
    },
    3: {
      label: "Give an Item",
      tooltip: "(-) Give the Delibirds a Held Item\n(+) Receive a Gift Item",
      select_prompt: "Select an item to give.",
      selected: `You toss the {{chosenItem}} to the Delibirds,\nwho chatter amongst themselves excitedly.
        $They turn back to you and happily give you a present!`,
    },
  },
  outro: `The Delibird pack happily waddles off into the distance.
    $What a curious little exchange!`
};
