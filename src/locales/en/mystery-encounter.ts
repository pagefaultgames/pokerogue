import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const mysteryEncounter: SimpleTranslationEntries = {
  "mysterious_challengers_intro_message": "Mysterious challengers have appeared!",
  "mysterious_challengers_title": "Mysterious Challengers",
  "mysterious_challengers_description": "If you defeat a challenger, you might impress them enough to receive a boon. If you lose, they might not be so kind.",
  "mysterious_challengers_query": "Who will you battle?",
  "mysterious_challengers_option_1_label": "A weak, but clever foe",
  "mysterious_challengers_option_2_label": "A strong foe",
  "mysterious_challengers_option_3_label": "The mightiest foe",
  "mysterious_challengers_option_4_label": "Leave",
  "mysterious_challengers_option_selected_message": "The trainer steps forward...",
  "mysterious_challengers_option_4_selected_message": "You hurry along your way, with a slight feeling of regret.",
  "mysterious_challengers_outro_win": "The mysterious challengers were defeated!",
  "mysterious_challengers_speaker": "Jimmy",
  "optionTooltip": "[+Some Stuff, -Some other Stuff, ???, this is a really long description of the option you're hovering]",

  "mysterious_chest_intro_message": "You keep going and find...@d{64}\na chest?",
  "mysterious_chest_title": "The Mysterious Chest",
  "mysterious_chest_description": "A beautifully ornamented chest stands on the ground. There must be something good inside... right?",
  "mysterious_chest_query": "Will you open it?",
  "mysterious_chest_option_1_label": "Open it",
  "mysterious_chest_option_2_label": "It's too risky, leave",
  "mysterious_chest_option_1_selected_message": "You open the chest to find...",
  "mysterious_chest_option_2_selected_message": "You hurry along your way,\nwith a slight feeling of regret.",
  "mysterious_chest_option_1_normal_result": "A decent selection of tools and items.",
  "mysterious_chest_option_1_good_result": "Some pretty handy tools and items.",
  "mysterious_chest_option_1_great_result": "A great selection of items!",
  "mysterious_chest_option_1_amazing_result": "Whoa! An amazing choice of items!",
  "mysterious_chest_option_1_bad_result": `Oh no!@d{32}\nThe chest was trapped!
  $Your @ec{pokeName} jumps in front of you\nbut is KOed in the process.`,

  "dark_deal_intro_message": "A strange man in a tattered coat stands in your way...",
  "dark_deal_speaker": "Shady Guy",
  //"dark_deal_intro_dialogue": `Hey, you!
  //  $I've been working on a new device\nto bring out a Pokémon's latent power!
  //  $It completely rebinds the Pokémon's atoms\nat a molecular level into a far more powerful form.
  //  $Hehe...@d{64} I just need some sac-@d{32}\nErr, test subjects, to prove it works.`,
  "dark_deal_intro_dialogue": "Hey, you!",
  "dark_deal_title": "Dark Deal",
  "dark_deal_description": "The disturbing fellow holds up some Pokéballs.\n\"I'll make it worth your while! You can have these strong Pokéballs as payment, All I need is a Pokémon from your team! Hehe...\"",
  "dark_deal_query": "What will you do?",
  "dark_deal_option_1_label": "Accept", // Give player 10 rogue balls. Remove a random Pokémon from player's party. Fight a legendary Pokémon as a boss
  "dark_deal_option_2_label": "Refuse",
  "dark_deal_option_1_selected": `Let's see, this one will do nicely!
  $Now remember, I'm not\nresponsible if anything bad happens!
  $Hehe...`,
  "dark_deal_option_1_selected_message": `You hand over your @ec{pokeName}...@d{64}
  $In return, the man hands you 10 Rogue Balls.
  $@ec{pokeName} hops into the strange machine...
  $Flashing lights and weird noises\nstart coming from the machine!
  $Eventually everything settles again.
  $...@d{64} Something emerges\nfrom the device, raging wildly!`,
  "dark_deal_option_2_selected": "Not gonna help a poor fellow out?\nPah!",
  "dark_deal_outro": "You leave, wondering if this was truly the best outcome...",

  "encounter_3": "A Ninjask stands in your way, but, this one seems different?",
  "encounter_3_id": "Shady Deal",
  "encounter_3_description": "Bzzzz, bzzzz... \nIt wants you to say yes or no.",
  "encounter_3_query": "Who will you battle?",
  "encounter_3_option_1": "Accept", // Give player 30 rogue balls. Fight a legendary Pokémon. Roll for:
  //  Toxic on your party; lose 60% money; OHKO your highest alive level PKMN; OHKO your two lowest level alive PKMN.
  "encounter_3_option_2": "Refuse",
  "encounter_3_option_3": "",
  "encounter_3_option_4": "",

} as const;
