import {SimpleTranslationEntries} from "#app/interfaces/locales";

export const mysteryEncounter: SimpleTranslationEntries = {

  // Mysterious Encounters -- Common Tier

  "mysterious_chest_intro_message": "You found...@d{32} a chest?",
  "mysterious_chest_title": "The Mysterious Chest",
  "mysterious_chest_description": "A beautifully ornamented chest stands on the ground. There must be something good inside... right?",
  "mysterious_chest_query": "Will you open it?",
  "mysterious_chest_option_1_label": "Open it",
  "mysterious_chest_option_1_tooltip": "(35%) Something terrible\n(40%) Okay Rewards\n(20%) Good Rewards\n(4%) Great Rewards\n(1%) Amazing Rewards",
  "mysterious_chest_option_2_label": "It's too risky, leave",
  "mysterious_chest_option_2_tooltip": "(-) No Rewards",
  "mysterious_chest_option_1_selected_message": "You open the chest to find...",
  "mysterious_chest_option_2_selected_message": "You hurry along your way,\nwith a slight feeling of regret.",
  "mysterious_chest_option_1_normal_result": "Just some normal tools and items.",
  "mysterious_chest_option_1_good_result": "Some pretty nice tools and items.",
  "mysterious_chest_option_1_great_result": "A couple great tools and items!",
  "mysterious_chest_option_1_amazing_result": "Whoa! An amazing item!",
  "mysterious_chest_option_1_bad_result": `Oh no!@d{32}\nThe chest was trapped!
  $Your @ec{pokeName} jumps in front of you\nbut is KOed in the process.`,

  "fight_or_flight_intro_message": "Something shiny is sparkling\non the ground near that Pokémon!",
  "fight_or_flight_title": "Fight or Flight",
  "fight_or_flight_description": "It looks like there's a strong Pokémon guarding an item. Battling is the straightforward approach, but this Pokémon looks strong. You could also try to sneak around, though the Pokémon might catch you.",
  "fight_or_flight_query": "What will you do?",
  "fight_or_flight_option_1_label": "Battle it",
  "fight_or_flight_option_1_tooltip": "(+) Hard Battle\n(+) New Item",
  "fight_or_flight_option_2_label": "Sneak around",
  "fight_or_flight_option_2_tooltip": "(35%) Steal Item\n(65%) Harder Battle",
  "fight_or_flight_option_3_label": "Leave",
  "fight_or_flight_option_3_tooltip": "(-) No Rewards",
  "fight_or_flight_option_1_selected_message": "You approach the\nPokémon without fear.",
  "fight_or_flight_option_2_good_result": `.@d{32}.@d{32}.@d{32}
  $You manage to sneak your way\npast and grab the item!`,
  "fight_or_flight_option_2_bad_result": `.@d{32}.@d{32}.@d{32}
  $The Pokémon catches you\nas you try to sneak around!`,
  "fight_or_flight_boss_enraged": "The opposing @ec{enemyPokemon} has become enraged!",
  "fight_or_flight_option_3_selected": "You leave the strong Pokémon\nwith its prize and continue on.",

  // Mysterious Encounters -- Uncommon Tier

  "mysterious_challengers_intro_message": "Mysterious challengers have appeared!",
  "mysterious_challengers_title": "Mysterious Challengers",
  "mysterious_challengers_description": "If you defeat a challenger, you might impress them enough to receive a boon. But some look tough, are you up to the challenge?",
  "mysterious_challengers_query": "Who will you battle?",
  "mysterious_challengers_option_1_label": "A clever, mindful foe",
  "mysterious_challengers_option_1_tooltip": "(+) Standard Battle\n(+) Move Item Rewards",
  "mysterious_challengers_option_2_label": "A strong foe",
  "mysterious_challengers_option_2_tooltip": "(+) Hard Battle\n(+) Good Rewards",
  "mysterious_challengers_option_3_label": "The mightiest foe",
  "mysterious_challengers_option_3_tooltip": "(+) Brutal Battle\n(+) Great Rewards",
  "mysterious_challengers_option_selected_message": "The trainer steps forward...",
  "mysterious_challengers_outro_win": "The mysterious challenger was defeated!",

  // Mysterious Encounters -- Rare Tier
  "training_session_intro_message": "You've come across a some\ntraining tools and supplies.",
  "training_session_title": "Training Session",
  "training_session_description": "These supplies look like they could be used to train a member of your party! There are a few ways you could train your Pokémon, by battling against it with the rest of your team.",
  "training_session_query": "How should you train?",
  "training_session_option_1_label": "Light Training",
  "training_session_option_1_tooltip": "(-) Light Battle\n(+) Improve 2 Random IVs of Pokémon",
  "training_session_option_2_label": "Moderate Training",
  "training_session_option_2_tooltip": "(-) Moderate Battle\n(+) Change Pokémon's Nature",
  "training_session_option_2_select_prompt": "Select a new nature\nto train your Pokémon in.",
  "training_session_option_3_label": "Heavy Training",
  "training_session_option_3_tooltip": "(-) Harsh Battle\n(+) Change Pokémon's Ability",
  "training_session_option_3_select_prompt": "Select a new ability\nto train your Pokémon in.",
  "training_session_option_selected_message": "@ec{selectedPokemon} moves across\nthe clearing to face you...",
  "training_session_battle_finished_1": `@ec{selectedPokemon} returns, feeling\nworn out but accomplished!
    $Its @ec{stat1} and @ec{stat2}IVs were improved!`,
  "training_session_battle_finished_2": `@ec{selectedPokemon} returns, feeling\nworn out but accomplished!
    $Its nature was changed to @ec{nature}!`,
  "training_session_battle_finished_3": `@ec{selectedPokemon} returns, feeling\nworn out but accomplished!
    $Its ability was changed to @ec{ability}!`,
  "training_session_outro_win": "That was a successful training session!",

  // Mysterious Encounters -- Super Rare Tier

  "dark_deal_intro_message": "A strange man in a tattered coat\nstands in your way...",
  "dark_deal_speaker": "Shady Guy",
  "dark_deal_intro_dialogue": `Hey, you!
    $I've been working on a new device\nto bring out a Pokémon's latent power!
    $It completely rebinds the Pokémon's atoms\nat a molecular level into a far more powerful form.
    $Hehe...@d{64} I just need some sac-@d{32}\nErr, test subjects, to prove it works.`,
  "dark_deal_title": "Dark Deal",
  "dark_deal_description": "The disturbing fellow holds up some Pokéballs.\n\"I'll make it worth your while! You can have these strong Pokéballs as payment, All I need is a Pokémon from your team! Hehe...\"",
  "dark_deal_query": "What will you do?",
  "dark_deal_option_1_label": "Accept", // Give player 10 rogue balls. Remove a random Pokémon from player's party. Fight a legendary Pokémon as a boss
  "dark_deal_option_1_tooltip": "(+) 5 Rogue Balls\n(?) Enhance a Random Pokémon", // Give player 10 rogue balls. Remove a random Pokémon from player's party. Fight a legendary Pokémon as a boss
  "dark_deal_option_2_label": "Refuse",
  "dark_deal_option_2_tooltip": "(-) No Rewards",
  "dark_deal_option_1_selected": `Let's see, that @ec{pokeName} will do nicely!
  $Remember, I'm not responsible\nif anything bad happens!@d{32} Hehe...`,
  "dark_deal_option_1_selected_message": `The man hands you 5 Rogue Balls.
  $@ec{pokeName} hops into the strange machine...
  $Flashing lights and weird noises\nstart coming from the machine!
  $...@d{96} Something emerges\nfrom the device, raging wildly!`,
  "dark_deal_option_2_selected": "Not gonna help a poor fellow out?\nPah!",
  "dark_deal_outro": "After the harrowing encounter,\nyou collect yourself and depart.",

  "sleeping_snorlax_intro_message": `As you walk down a narrow pathway, you see a towering silhouette blocking your path.
  $You get closer to see a Snorlax sleeping peacefully.\nIt seems like there's no way around it.`,
  "sleeping_snorlax_title": "Sleeping Snorlax",
  "sleeping_snorlax_description": "You could attack it to try and get it to move, or simply wait for it to wake up.",
  "sleeping_snorlax_query": "What will you do?",
  "sleeping_snorlax_option_1_label": "Fight it",
  "sleeping_snorlax_option_1_tooltip": "(+) Fight Sleeping Snorlax",
  "sleeping_snorlax_option_2_label": "Wait for it to move",
  "sleeping_snorlax_option_2_tooltip": "(75%) Wait a short time\n(25%) Wait a long time",
  "sleeping_snorlax_option_3_label": "Steal",
  "sleeping_snorlax_option_3_tooltip": "(+) Leftovers",
  "sleeping_snorlax_option_3_disabled_tooltip": "Your Pokémon need to know certain moves to choose this",
  "sleeping_snorlax_option_1_selected_message": "You approach the\nPokémon without fear.",
  "sleeping_snorlax_option_2_selected_message": `.@d{32}.@d{32}.@d{32}
  $You wait for a time, but the Snorlax's yawns make your party sleepy.`,
  "sleeping_snorlax_option_2_good_result": "When you all awaken, the Snorlax is no where to be found - but your Pokémon are all healed!",
  "sleeping_snorlax_option_2_bad_result": `Your @ec{primaryName} is still asleep...
  $But on the bright side, the Snorlax left something behind...
  $@s{item_fanfare}You gained a Berry!`,
  "sleeping_snorlax_option_3_good_result": "Your @ec{option3PrimaryName} uses @ec{option3PrimaryMove}! @s{item_fanfare}It steals Leftovers off the sleeping Snorlax and you make out like bandits!",
  // "sleeping_snorlax_outro_win": "The mysterious challengers were defeated!",

} as const;
