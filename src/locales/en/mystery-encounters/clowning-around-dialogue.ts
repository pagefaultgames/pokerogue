export const clowningAroundDialogue = {
  intro: "It's...@d{64} a clown?",
  speaker: "Clown",
  intro_dialogue: `Bumbling buffoon,\nbrace for a brilliant battle!
    $You’ll be beaten by this brawling busker!\nBring it!`,
  title: "Clowning Around",
  description: "The clown seems eager to goad you into a battle, but to what end?\n\nSomething is off about this encounter.",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle the Clown",
      tooltip: "(-) Strange Battle\n(?) Affects Pokémon Abilities",
      selected: "Your pitiful Pokémon are poised for a pathetic performance!"
    },
    2: {
      label: "Remain Unprovoked",
      tooltip: "(-) Upsets the Clown\n(?) Affects Pokémon Items",
      selected: "Dismal dodger, you deny a delightful duel?\nFeel my fury!",
      selected_2: `The clown's Blacephalon uses Trick!
        All of your {{switchPokemon}}'s items were randomly swapped!`,
      selected_3: "Flustered fool, fall for my flawless deception!",
    },
    3: {
      label: "Return the Insults",
      tooltip: "(-) Upsets the Clown\n(?) Affects Pokémon Types",
      selected: "I'm appalled at your absurd antics!\nTaste my temper!",
      selected_2: `The clown's Blacephalon uses\na move you've never seen before!
        All of your team's types were randomly swapped!`,
      selected_3: "Flustered fool, fall for my flawless deception!",
    },
  },
  outro: "The clown and his cohorts\ndisappear in a puff of smoke."
};
