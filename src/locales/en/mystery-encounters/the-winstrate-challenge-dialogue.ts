export const theWinstrateChallengeDialogue = {
  intro: "It's a family standing outside their house!",
  speaker: "The Winstrates",
  intro_dialogue: `We're the Winstrates!
    $What do you say to taking on our family in a series of Pokémon battles?`,
  title: "The Winstrate Challenge",
  description: "The Winstrates are a family of 5 trainers, and they want to battle! If you beat all of them back-to-back, they'll give you a grand prize. But can you handle the heat?",
  query: "What will you do?",
  option: {
    1: {
      label: "Accept the Challenge",
      tooltip: "(-) Brutal Battle\n(+) Special Item Reward",
      selected: "That's the spirit! I like you!",
    },
    2: {
      label: "Refuse the Challenge",
      tooltip: "(+) Full Heal Party\n(+) Gain a Rarer Candy",
      selected: "That's too bad. Say, your team looks worn out, why don't you stay awhile and rest?"
    },
  },
  victory: `Congratulations on beating our challenge!
    $Our family uses this Macho Brace to strengthen our Pokémon more effectively during their training.
    $You may not need it, considering that you beat the whole lot of us, but we hope you'll accept it anyway!`,
};
