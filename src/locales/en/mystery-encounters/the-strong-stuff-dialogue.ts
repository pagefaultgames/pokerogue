export const theStrongStuffDialogue = {
  intro: "It's a massive Shuckle and what appears\nto be an equally large stash of... juice?",
  title: "The Strong Stuff",
  description: "The Shuckle that blocks your path looks incredibly strong. Meanwhile, the juice next to it is emanating power of some kind.\n\nThe Shuckle extends its feelers in your direction. It seems like it wants to touch you, but is that really a good idea?",
  query: "What will you do?",
  option: {
    1: {
      label: "Let it touch you",
      tooltip: "(?) Something awful or amazing might happen",
      selected: "You black out.",
      selected_2: `@f{150}When you awaken, the Shuckle is gone\nand juice stash completely drained.
        $Your {{highBstPokemon}} feels a\nterrible lethargy come over it!
        $It's base stats were reduced by 20 in each stat!
        $Your remaining Pokémon feel an incredible vigor, though!
        $Their base stats are increased by 10 in each stat!`
    },
    2: {
      label: "Battle the Shuckle",
      tooltip: "(-) Hard Battle\n(+) Special Rewards",
      selected: "Enraged, the Shuckle drinks some of its juice and attacks!",
      stat_boost: "The Shuckle's juice boosts its stats!",
    },
  },
  outro: "What a bizarre turn of events."
};
