export const absoluteAvariceDialogue = {
  intro: "A Greedent ambushed you\nand stole your party's berries!",
  title: "Absolute Avarice",
  description: "The Greedent has caught you totally off guard now all your berries are gone!\n\nThe Greedent looks like it's about to eat them when it pauses to look at you, interested.",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle It",
      tooltip: "(-) Tough Battle\n(+) Rewards from its Berry Hoard",
      selected: "You'll show this Greedent what\nhappens to those who steal from you!",
    },
    2: {
      label: "Reason with It",
      tooltip: "(+) Regain Some Lost Berries",
      selected: `Your pleading strikes a chord with the Greedent.
        $It doesn't give all your berries back, but still tosses a few in your direction.`,
    },
    3: {
      label: "Let It Have the Food",
      tooltip: "(-) Lose All Berries\n(?) The Greedent Will Like You",
      selected: `The Greedent devours the entire stash of berries in a flash!
        $Patting its stomach, it looks at you appreciatively.
        $Perhaps you could feed it more berries on your adventure...
        $The Greedent wants to join your party!`,
    },
  }
};
