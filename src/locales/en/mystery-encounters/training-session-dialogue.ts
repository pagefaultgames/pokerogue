export const trainingSessionDialogue = {
  intro: "You've come across some\ntraining tools and supplies.",
  title: "Training Session",
  description: "These supplies look like they could be used to train a member of your party! There are a few ways you could train your Pokémon, by battling against it with the rest of your team.",
  query: "How should you train?",
  option: {
    1: {
      label: "Light Training",
      tooltip: "(-) Light Battle\n(+) Improve 2 Random IVs of Pokémon",
      finished: `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
        $Its {{stat1}} and {{stat2}} IVs were improved!`,
    },
    2: {
      label: "Moderate Training",
      tooltip: "(-) Moderate Battle\n(+) Change Pokémon's Nature",
      select_prompt: "Select a new nature\nto train your Pokémon in.",
      finished: `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
        $Its nature was changed to {{nature}}!`,
    },
    3: {
      label: "Heavy Training",
      tooltip: "(-) Harsh Battle\n(+) Change Pokémon's Ability",
      select_prompt: "Select a new ability\nto train your Pokémon in.",
      finished: `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
        $Its ability was changed to {{ability}}!`,
    },
    selected: "{{selectedPokemon}} moves across\nthe clearing to face you...",
  },
  outro: "That was a successful training session!",
};
