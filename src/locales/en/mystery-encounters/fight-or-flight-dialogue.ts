export const fightOrFlightDialogue = {
  intro: "Something shiny is sparkling\non the ground near that Pokémon!",
  title: "Fight or Flight",
  description: "It looks like there's a strong Pokémon guarding an item. Battling is the straightforward approach, but this Pokémon looks strong. You could also try to sneak around, though the Pokémon might catch you.",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle the Pokémon",
      tooltip: "(-) Hard Battle\n(+) New Item",
      selected: "You approach the\nPokémon without fear.",
    },
    2: {
      label: "Steal the item",
      tooltip: "@[SUMMARY_GREEN]{(35%) Steal Item}\n@[SUMMARY_BLUE]{(65%) Harder Battle}",
      tooltip_special: "(+) {{option2PrimaryName}} uses {{option2PrimaryMove}}",
      good_result: `.@d{32}.@d{32}.@d{32}
        $You manage to sneak your way\npast and grab the item!`,
      special_result: `.@d{32}.@d{32}.@d{32}
        $Your {{option2PrimaryName}} helps you out and uses {{option2PrimaryMove}}!
        $ You nabbed the item!`,
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
