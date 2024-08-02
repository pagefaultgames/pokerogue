export const berriesAboundDialogue = {
  intro: "There's a huge berry bush\nnear that Pokémon!",
  title: "Berries Abound",
  description: "It looks like there's a strong Pokémon guarding a berry bush. Battling is the straightforward approach, but this Pokémon looks strong. You could also try to sneak around, though the Pokémon might catch you.",
  query: "What will you do?",
  berries: "Berries!",
  option: {
    1: {
      label: "Battle the Pokémon",
      tooltip: "(-) Hard Battle\n(+) New Item",
      selected: "You approach the\nPokémon without fear.",
    },
    2: {
      label: "Steal the Berries",
      tooltip: "@[SUMMARY_GREEN]{(35%) Steal Item}\n@[SUMMARY_BLUE]{(65%) Harder Battle}",
      tooltip_special: "(+) {{option2PrimaryName}} uses {{option2PrimaryMove}}",
      good_result: `.@d{32}.@d{32}.@d{32}
        $You manage to sneak your way\npast and grab the berries!`,
      special_result: `.@d{32}.@d{32}.@d{32}
        $Your {{option2PrimaryName}} helps you out and uses {{option2PrimaryMove}}!
        $You nabbed the berries!`,
      bad_result: `.@d{32}.@d{32}.@d{32}
        $The Pokémon catches you\nas you try to sneak around!`,
      boss_enraged: "The opposing {{enemyPokemon}} has become enraged!"
    },
    3: {
      label: "Leave",
      tooltip: "(-) No Rewards",
      selected: "You leave the strong Pokémon\nwith its prize and continue on.",
    },
  }
};
