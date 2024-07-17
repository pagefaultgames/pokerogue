export const lostAtSea = {
  intro: "Wandering aimlessly, you effectively get nowhere.",
  title: "Lost at sea",
  description: "The sea is turbulent in this area, and you seem to be running out of fuel.\nThis is bad. Is there a way out of the situation?",
  query: "What will you do?",
  option: {
    1: {
      label: "{{option1PrimaryName}} can help",
      label_disabled: "Can't {{option1RequiredMove}}",
      tooltip: "(+) {{option1PrimaryName}} saves you.\n(+) {{option1PrimaryName}} gains some EXP.",
      tooltip_disabled: "You have no Pokémon to {{option1RequiredMove}} on",
      selected:
        "{{option1PrimaryName}} swims ahead, guiding you back on track.\n{{option1PrimaryName}} seems to also have gotten stronger in this time of need.",
    },
    2: {
      label: "{{option2PrimaryName}} can help",
      label_disabled: "Can't {{option2RequiredMove}}",
      tooltip: "(+) {{option2PrimaryName}} saves you.\n(+) {{option2PrimaryName}} gains some EXP.",
      tooltip_disabled: "You have no Pokémon to {{option2RequiredMove}} with",
      selected:
        "{{option2PrimaryName}} flies ahead of your boat, guiding you back on track.\n{{option2PrimaryName}} seems to also have gotten stronger in this time of need.",
    },
    3: {
      label: "Wander aimlessly",
      tooltip: "(-) Each of your Pokémon lose {{damagePercentage}}% of their total HP.",
      selected: `You float about in the boat, steering it aimlessly until you finally get back on track.
                  $You and your Pokémon get very fatigued during the whole ordeal.`,
    },
  },
  outro: "You are back on track."
};
