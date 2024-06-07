import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const mysteryEncounter: SimpleTranslationEntries = {

  // Mysterious Encounters -- Common Tier

  "mysterious_chest_intro_message": "You keep going and find...@d{64}\na chest?",
  "mysterious_chest_title": "The Mysterious Chest",
  "mysterious_chest_description": "A beautifully ornamented chest stands on the ground. There must be something good inside... right?",
  "mysterious_chest_query": "Will you open it?",
  "mysterious_chest_option_1_label": "Open it",
  "mysterious_chest_option_1_tooltip": "(75%) Varying Treasure\n(25%) Chest is Trapped",
  "mysterious_chest_option_2_label": "It's too risky, leave",
  "mysterious_chest_option_2_tooltip": "(-) No Rewards",
  "mysterious_chest_option_1_selected_message": "You open the chest to find...",
  "mysterious_chest_option_2_selected_message": "You hurry along your way,\nwith a slight feeling of regret.",
  "mysterious_chest_option_1_normal_result": "A decent selection of tools and items.",
  "mysterious_chest_option_1_good_result": "Some pretty handy tools and items.",
  "mysterious_chest_option_1_great_result": "A great selection of items!",
  "mysterious_chest_option_1_amazing_result": "Whoa! An amazing choice of items!",
  "mysterious_chest_option_1_bad_result": `Oh no!@d{32}\nThe chest was trapped!
  $Your @ec{pokeName} jumps in front of you\nbut is KOed in the process.`,

  // Mysterious Encounters -- Rare Tier

  "mysterious_challengers_intro_message": "Mysterious challengers have appeared!",
  "mysterious_challengers_title": "Mysterious Challengers",
  "mysterious_challengers_description": "If you defeat a challenger, you might impress them enough to receive a boon. But some look tough, are you up to the challenge?",
  "mysterious_challengers_query": "Who will you battle?",
  "mysterious_challengers_option_1_label": "A weak, clever foe",
  "mysterious_challengers_option_1_tooltip": "(+) Easy Battle\n(+) Weak Rewards",
  "mysterious_challengers_option_2_label": "A strong foe",
  "mysterious_challengers_option_2_tooltip": "(+) Medium Battle\n(+) Medium Rewards",
  "mysterious_challengers_option_3_label": "The mightiest foe",
  "mysterious_challengers_option_3_tooltip": "(+) Hard Battle\n(+) Great Rewards",
  "mysterious_challengers_option_4_label": "Leave",
  "mysterious_challengers_option_4_tooltip": "(-) No Rewards",
  "mysterious_challengers_option_selected_message": "The trainer steps forward...",
  "mysterious_challengers_option_4_selected_message": "You hurry along your way, with a slight feeling of regret.",
  "mysterious_challengers_outro_win": "The mysterious challengers were defeated!",
  "mysterious_challengers_speaker": "Jimmy",


  // Mysterious Encounters -- Epic Tier
  // Gholdengo Gang

  // Mysterious Encounters -- Legendary Tier

  "dark_deal_intro_message": "A strange man in a tattered coat stands in your way...",
  "dark_deal_speaker": "Shady Guy",
  "dark_deal_intro_dialogue": `Hey, you!
    $I've been working on a new device\nto bring out a Pokémon's latent power!
    $It completely rebinds the Pokémon's atoms\nat a molecular level into a far more powerful form.
    $Hehe...@d{64} I just need some sac-@d{32}\nErr, test subjects, to prove it works.`,
  "dark_deal_title": "Dark Deal",
  "dark_deal_description": "The disturbing fellow holds up some Pokéballs.\n\"I'll make it worth your while! You can have these strong Pokéballs as payment, All I need is a Pokémon from your team! Hehe...\"",
  "dark_deal_query": "What will you do?",
  "dark_deal_option_1_label": "Accept", // Give player 10 rogue balls. Remove a random Pokémon from player's party. Fight a legendary Pokémon as a boss
  "dark_deal_option_1_tooltip": "(+) 10 Rogue Balls\n(?) Enhance a Random Pokémon", // Give player 10 rogue balls. Remove a random Pokémon from player's party. Fight a legendary Pokémon as a boss
  "dark_deal_option_2_label": "Refuse",
  "dark_deal_option_2_tooltip": "(-) No Rewards",
  "dark_deal_option_1_selected": `Let's see, that @ec{pokeName} will do nicely!
  $Remember, I'm not responsible\nif anything bad happens!@d{32} Hehe...`,
  "dark_deal_option_1_selected_message": `The man hands you 10 Rogue Balls.
  $@ec{pokeName} hops into the strange machine...
  $Flashing lights and weird noises\nstart coming from the machine!
  $...@d{96} Something emerges\nfrom the device, raging wildly!`,
  "dark_deal_option_2_selected": "Not gonna help a poor fellow out?\nPah!",
  "dark_deal_outro": "After the harrowing encounter,\nyou collect yourself and depart.",

} as const;
