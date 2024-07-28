export const absoluteAvariceDialogue = {
  intro: "A Greedent ambushed you\nand stole your party's berries!",
  title: "Absolute Avarice",
  description: "The Greedent has caught you totally off guard now all your berries are gone!\n\nThe Greedent looks like it's about to eat them when it pauses to look at you, interested.",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle It",
      tooltip: "(-) Tough Battle\n(+) Rewards from its Berry Hoard",
      selected: "The Greedent stuffs its cheeks\nand prepares for battle!",
      boss_enraged: "Greedent's fierce love for food has it incensed!",
      food_stash: `It looks like the Greedent was guarding an enormous stash of food!
        $@s{item_fanfare}Each Pokémon in your party gains 1x Reviver Seed!`
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
      selected: `The Greedent devours the entire\nstash of berries in a flash!
        $Patting its stomach,\nit looks at you appreciatively.
        $Perhaps you could feed it\nmore berries on your adventure...
        $@s{level_up_fanfare}The Greedent wants to join your party!`,
    },
  }
};
