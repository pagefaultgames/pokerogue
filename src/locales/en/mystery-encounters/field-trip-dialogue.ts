export const fieldTripDialogue = {
  intro: "It's a teacher and some school children!",
  speaker: "Teacher",
  intro_dialogue: `Hello, there! Would you be able to\nspare a minute for my students?
    $I'm teaching them about Pokémon moves\nand would love to show them a demonstration.
    $Would you mind showing us one of\nthe moves your Pokémon can use?`,
  title: "Field Trip",
  description: "A teacher is requesting a move demonstration from a Pokémon. Depending on the move you choose, she might have something useful for you in exchange.",
  query: "Which move category will you show off?",
  option: {
    1: {
      label: "A Physical Move",
      tooltip: "(+) Physical Item Rewards",
    },
    2: {
      label: "A Special Move",
      tooltip: "(+) Special Item Rewards",
    },
    3: {
      label: "A Status Move",
      tooltip: "(+) Status Item Rewards",
    },
    selected: "{{pokeName}} shows off an awesome display of {{move}}!",
    incorrect: `...
      $That isn't a {{moveCategory}} move!
      $I'm sorry, but I can't give you anything.`,
    lesson_learned: `Looks like you learned a valuable lesson?
      $Your Pokémon also gained some knowledge.`
  },
  second_option_prompt: "Choose a move for your Pokémon to use.",
  outro_good: "Thank you so much for your kindness!\nI hope the items I had were helpful!",
  outro_bad: "Come along children, we'll\nfind a better demonstration elsewhere."
};
