export const slumberingSnorlaxDialogue = {
  intro: `As you walk down a narrow pathway, you see a towering silhouette blocking your path.
  $You get closer to see a Snorlax sleeping peacefully.\nIt seems like there's no way around it.`,
  title: "Slumbering Snorlax",
  description: "You could attack it to try and get it to move, or simply wait for it to wake up. Who knows how long that could take, though...",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle it",
      tooltip: "(-) Fight Sleeping Snorlax\n(+) Special Reward",
      selected: "You approach the\nPokémon without fear.",
    },
    2: {
      label: "Wait for it to move",
      tooltip: "(-) Wait a Long Time\n(+) Recover Party",
      selected: `.@d{32}.@d{32}.@d{32}
        $You wait for a time, but the Snorlax's yawns make your party sleepy...`,
      rest_result: "When you all awaken, the Snorlax is no where to be found -\nbut your Pokémon are all healed!",
    },
    3: {
      label: "Steal its item",
      tooltip: "(+) {{option3PrimaryName}} uses {{option3PrimaryMove}}\n(+) Special Reward",
      disabled_tooltip: "Your Pokémon need to know certain moves to choose this",
      selected: `Your {{option3PrimaryName}} uses {{option3PrimaryMove}}!
        $@s{item_fanfare}It steals Leftovers off the sleeping\nSnorlax and you make out like bandits!`,
    },
  }
};
