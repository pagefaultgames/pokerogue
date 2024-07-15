import { lostAtSea } from "./mystery-encounters/lost-at-sea";

/**
 * Patterns that can be used:
 * '$' will be treated as a new line for Message and Dialogue strings
 * '@d{<number>}' will add a time delay to text animation for Message and Dialogue strings
 *
 * '{{<token>}}' will auto-inject the matching token value for the specified Encounter that is stored in dialogueTokens
 * (see [i18next interpolations](https://www.i18next.com/translation-function/interpolation))
 *
 * '@[<TextStyle>]{<text>}' will auto-color the given text to a specified TextStyle (e.g. TextStyle.SUMMARY_GREEN)
 *
 * Any '(+)' or '(-)' type of tooltip will auto-color to green/blue respectively. THIS ONLY OCCURS FOR OPTION TOOLTIPS, NOWHERE ELSE
 * Other types of '(...)' tooltips will have to specify the text color manually by using '@[SUMMARY_GREEN]{<text>}' pattern
 */
export const mysteryEncounter = {
  // DO NOT REMOVE
  "unit_test_dialogue": "{{test}}{{test}} {{test{{test}}}} {{test1}} {{test\}} {{test\\}} {{test\\\}} {test}}",

  // General use content
  "paid_money": "You paid ₽{{amount, number}}.",
  "receive_money": "You received ₽{{amount, number}}!",

  // Mystery Encounters -- Common Tier

  "mysterious_chest_intro_message": "You found...@d{32} a chest?",
  "mysterious_chest_title": "The Mysterious Chest",
  "mysterious_chest_description": "A beautifully ornamented chest stands on the ground. There must be something good inside... right?",
  "mysterious_chest_query": "Will you open it?",
  "mysterious_chest_option_1_label": "Open it",
  "mysterious_chest_option_1_tooltip": "@[SUMMARY_BLUE]{(35%) Something terrible}\n@[SUMMARY_GREEN]{(40%) Okay Rewards}\n@[SUMMARY_GREEN]{(20%) Good Rewards}\n@[SUMMARY_GREEN]{(4%) Great Rewards}\n@[SUMMARY_GREEN]{(1%) Amazing Rewards}",
  "mysterious_chest_option_2_label": "It's too risky, leave",
  "mysterious_chest_option_2_tooltip": "(-) No Rewards",
  "mysterious_chest_option_1_selected_message": "You open the chest to find...",
  "mysterious_chest_option_2_selected_message": "You hurry along your way,\nwith a slight feeling of regret.",
  "mysterious_chest_option_1_normal_result": "Just some normal tools and items.",
  "mysterious_chest_option_1_good_result": "Some pretty nice tools and items.",
  "mysterious_chest_option_1_great_result": "A couple great tools and items!",
  "mysterious_chest_option_1_amazing_result": "Whoa! An amazing item!",
  "mysterious_chest_option_1_bad_result": `Oh no!@d{32}\nThe chest was trapped!
  $Your {{pokeName}} jumps in front of you\nbut is KOed in the process.`,

  "fight_or_flight_intro_message": "Something shiny is sparkling\non the ground near that Pokémon!",
  "fight_or_flight_title": "Fight or Flight",
  "fight_or_flight_description": "It looks like there's a strong Pokémon guarding an item. Battling is the straightforward approach, but this Pokémon looks strong. You could also try to sneak around, though the Pokémon might catch you.",
  "fight_or_flight_query": "What will you do?",
  "fight_or_flight_option_1_label": "Battle the Pokémon",
  "fight_or_flight_option_1_tooltip": "(-) Hard Battle\n(+) New Item",
  "fight_or_flight_option_2_label": "Steal the item",
  "fight_or_flight_option_2_tooltip": "@[SUMMARY_GREEN]{(35%) Steal Item}\n@[SUMMARY_BLUE]{(65%) Harder Battle}",
  "fight_or_flight_option_2_steal_tooltip": "(+) {{option2PrimaryName}} uses {{option2PrimaryMove}}",
  "fight_or_flight_option_3_label": "Leave",
  "fight_or_flight_option_3_tooltip": "(-) No Rewards",
  "fight_or_flight_option_1_selected_message": "You approach the\nPokémon without fear.",
  "fight_or_flight_option_2_good_result": `.@d{32}.@d{32}.@d{32}
  $You manage to sneak your way\npast and grab the item!`,
  "fight_or_flight_option_2_steal_result": `.@d{32}.@d{32}.@d{32}
  $Your {{option2PrimaryName}} helps you out and uses {{option2PrimaryMove}}!
  $ You nabbed the item!`,
  "fight_or_flight_option_2_bad_result": `.@d{32}.@d{32}.@d{32}
  $The Pokémon catches you\nas you try to sneak around!`,
  "fight_or_flight_boss_enraged": "The opposing {{enemyPokemon}} has become enraged!",
  "fight_or_flight_option_3_selected": "You leave the strong Pokémon\nwith its prize and continue on.",

  "department_store_sale_intro_message": "It's a lady with a ton of shopping bags.",
  "department_store_sale_speaker": "Shopper",
  "department_store_sale_intro_dialogue": `Hello! Are you here for\nthe amazing sales too?
    $There's a special coupon that you can\nredeem for a free item during the sale!
    $I have an extra one. Here you go!`,
  "department_store_sale_title": "Department Store Sale",
  "department_store_sale_description": "There is merchandise in every direction! It looks like there are 4 counters where you can redeem the coupon for various items. The possibilities are endless!",
  "department_store_sale_query": "Which counter will you go to?",
  "department_store_sale_option_1_label": "TM Counter",
  "department_store_sale_option_1_tooltip": "(+) TM Shop",
  "department_store_sale_option_2_label": "Vitamin Counter",
  "department_store_sale_option_2_tooltip": "(+) Vitamin Shop",
  "department_store_sale_option_3_label": "Battle Item Counter",
  "department_store_sale_option_3_tooltip": "(+) X Item Shop",
  "department_store_sale_option_4_label": "Pokéball Counter",
  "department_store_sale_option_4_tooltip": "(+) Pokéball Shop",
  "department_store_sale_outro": "What a deal! You should shop there more often.",

  "shady_vitamin_dealer_intro_message": "A man in a dark coat approaches you.",
  "shady_vitamin_dealer_speaker": "Shady Salesman",
  "shady_vitamin_dealer_intro_dialogue": `.@d{16}.@d{16}.@d{16}
    $I've got the goods if you've got the money.
    $Make sure your Pokémon can handle it though.`,
  "shady_vitamin_dealer_title": "The Vitamin Dealer",
  "shady_vitamin_dealer_description": "The man opens his jacket to reveal some Pokémon vitamins. The numbers he quotes seem like a really good deal. Almost too good...\nHe offers two package deals to choose from.",
  "shady_vitamin_dealer_query": "Which deal will choose?",
  "shady_vitamin_dealer_invalid_selection": "Pokémon must be healthy enough.",
  "shady_vitamin_dealer_option_1_label": "The Cheap Deal",
  "shady_vitamin_dealer_option_1_tooltip": "(-) Pay {{option1Money, money}}\n(-) Side Effects?\n(+) Chosen Pokémon Gains 2 Random Vitamins",
  "shady_vitamin_dealer_option_2_label": "The Pricey Deal",
  "shady_vitamin_dealer_option_2_tooltip": "(-) Pay {{option2Money, money}}\n(-) Side Effects?\n(+) Chosen Pokémon Gains 2 Random Vitamins",
  "shady_vitamin_dealer_option_selected": `The man hands you two bottles and quickly disappears.
    \${{selectedPokemon}} gained {{boost1}} and {{boost2}} boosts!`,
  "shady_vitamin_dealer_damage_only": `But the medicine had some side effects!
  $Your {{selectedPokemon}} takes some damage...`,
  "shady_vitamin_dealer_bad_poison": `But the medicine had some side effects!
  $Your {{selectedPokemon}} takes some damage\nand becomes badly poisoned...`,
  "shady_vitamin_dealer_poison": `But the medicine had some side effects!
  $Your {{selectedPokemon}} becomes poisoned...`,
  "shady_vitamin_dealer_no_bad_effects": "Looks like there were no side-effects this time.",
  "shady_vitamin_dealer_option_3_label": "Leave",
  "shady_vitamin_dealer_option_3_tooltip": "(-) No Rewards",

  "field_trip_intro_message": "It's a teacher and some school children!",
  "field_trip_speaker": "Teacher",
  "field_trip_intro_dialogue": `Hello, there! Would you be able to\nspare a minute for my students?
    $I'm teaching them about Pokémon moves\nand would love to show them a demonstration.
    $Would you mind showing us one of\nthe moves your Pokémon can use?`,
  "field_trip_title": "Field Trip",
  "field_trip_description": "A teacher is requesting a move demonstration from a Pokémon. Depending on the move you choose, she might have something useful for you in exchange.",
  "field_trip_query": "Which move category will you show off?",
  "field_trip_option_1_label": "A Physical Move",
  "field_trip_option_1_tooltip": "(+) Physical Item Rewards",
  "field_trip_option_2_label": "A Special Move",
  "field_trip_option_2_tooltip": "(+) Special Item Rewards",
  "field_trip_option_3_label": "A Status Move",
  "field_trip_option_3_tooltip": "(+) Status Item Rewards",
  "field_trip_second_option_prompt": "Choose a move for your Pokémon to use.",
  "field_trip_option_selected": "{{pokeName}} shows off an awesome display of {{move}}!",
  "field_trip_option_incorrect": `...
    $That isn't a {{moveCategory}} move!
    $I'm sorry, but I can't give you anything.`,
  "field_trip_lesson_learned": `Looks like you learned a valuable lesson?
    $Your Pokémon also gained some knowledge.`,
  "field_trip_outro_good": "Thank you so much for your kindness!\nI hope the items I had were helpful!",
  "field_trip_outro_bad": "Come along children, we'll\nfind a better demonstration elsewhere.",

  // Mystery Encounters -- Great Tier

  "mysterious_challengers_intro_message": "Mysterious challengers have appeared!",
  "mysterious_challengers_title": "Mysterious Challengers",
  "mysterious_challengers_description": "If you defeat a challenger, you might impress them enough to receive a boon. But some look tough, are you up to the challenge?",
  "mysterious_challengers_query": "Who will you battle?",
  "mysterious_challengers_option_1_label": "A clever, mindful foe",
  "mysterious_challengers_option_1_tooltip": "(-) Standard Battle\n(+) Move Item Rewards",
  "mysterious_challengers_option_2_label": "A strong foe",
  "mysterious_challengers_option_2_tooltip": "(-) Hard Battle\n(+) Good Rewards",
  "mysterious_challengers_option_3_label": "The mightiest foe",
  "mysterious_challengers_option_3_tooltip": "(-) Brutal Battle\n(+) Great Rewards",
  "mysterious_challengers_option_selected_message": "The trainer steps forward...",
  "mysterious_challengers_outro_win": "The mysterious challenger was defeated!",

  "safari_zone_intro_message": "It's a safari zone!",
  "safari_zone_title": "The Safari Zone",
  "safari_zone_description": "There are all kinds of rare and special Pokémon that can be found here!\nIf you choose to enter, you'll have a time limit of 3 wild encounters where you can try to catch these special Pokémon.\n\nBeware, though. These Pokémon may flee before you're able to catch them!",
  "safari_zone_query": "Would you like to enter?",
  "safari_zone_option_1_label": "Enter",
  "safari_zone_option_1_tooltip": "(-) Pay {{option1Money, money}}\n@[SUMMARY_GREEN]{(?) Safari Zone}",
  "safari_zone_option_2_label": "Leave",
  "safari_zone_option_2_tooltip": "(-) No Rewards",
  "safari_zone_option_1_selected_message": "Time to test your luck!",
  "safari_zone_option_2_selected_message": "You hurry along your way,\nwith a slight feeling of regret.",
  "safari_zone_pokeball_option_label": "Throw a Pokéball",
  "safari_zone_pokeball_option_tooltip": "(+) Throw a Pokéball",
  "safari_zone_pokeball_option_selected": "You throw a Pokéball!",
  "safari_zone_bait_option_label": "Throw bait",
  "safari_zone_bait_option_tooltip": "(+) Increases Capture Rate\n(-) Chance to Increase Flee Rate",
  "safari_zone_bait_option_selected": "You throw some bait!",
  "safari_zone_mud_option_label": "Throw mud",
  "safari_zone_mud_option_tooltip": "(+) Decreases Flee Rate\n(-) Chance to Decrease Capture Rate",
  "safari_zone_mud_option_selected": "You throw some mud!",
  "safari_zone_flee_option_label": "Flee",
  "safari_zone_flee_option_tooltip": "(?) Flee from this Pokémon",
  "safari_zone_pokemon_watching": "{{pokemonName}} is watching carefully!",
  "safari_zone_pokemon_eating": "{{pokemonName}} is eating!",
  "safari_zone_pokemon_busy_eating": "{{pokemonName}} is busy eating!",
  "safari_zone_pokemon_angry": "{{pokemonName}} is angry!",
  "safari_zone_pokemon_beside_itself_angry": "{{pokemonName}} is beside itself with anger!",
  "safari_zone_remaining_count": "{{remainingCount}} Pokémon remaining!",

  // Mystery Encounters -- Ultra Tier

  "training_session_intro_message": "You've come across some\ntraining tools and supplies.",
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
  "training_session_option_selected_message": "{{selectedPokemon}} moves across\nthe clearing to face you...",
  "training_session_battle_finished_1": `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
    $Its {{stat1}} and {{stat2}} IVs were improved!`,
  "training_session_battle_finished_2": `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
    $Its nature was changed to {{nature}}!`,
  "training_session_battle_finished_3": `{{selectedPokemon}} returns, feeling\nworn out but accomplished!
    $Its ability was changed to {{ability}}!`,
  "training_session_outro_win": "That was a successful training session!",

  // Mystery Encounters -- Rogue Tier

  "dark_deal_intro_message": "A strange man in a tattered coat\nstands in your way...",
  "dark_deal_speaker": "Shady Guy",
  "dark_deal_intro_dialogue": `Hey, you!
    $I've been working on a new device\nto bring out a Pokémon's latent power!
    $It completely rebinds the Pokémon's atoms\nat a molecular level into a far more powerful form.
    $Hehe...@d{64} I just need some sac-@d{32}\nErr, test subjects, to prove it works.`,
  "dark_deal_title": "Dark Deal",
  "dark_deal_description": "The disturbing fellow holds up some Pokéballs.\n\"I'll make it worth your while! You can have these strong Pokéballs as payment, All I need is a Pokémon from your team! Hehe...\"",
  "dark_deal_query": "What will you do?",
  "dark_deal_option_1_label": "Accept",
  "dark_deal_option_1_tooltip": "(+) 5 Rogue Balls\n(?) Enhance a Random Pokémon",
  "dark_deal_option_2_label": "Refuse",
  "dark_deal_option_2_tooltip": "(-) No Rewards",
  "dark_deal_option_1_selected": `Let's see, that {{pokeName}} will do nicely!
  $Remember, I'm not responsible\nif anything bad happens!@d{32} Hehe...`,
  "dark_deal_option_1_selected_message": `The man hands you 5 Rogue Balls.
  \${{pokeName}} hops into the strange machine...
  $Flashing lights and weird noises\nstart coming from the machine!
  $...@d{96} Something emerges\nfrom the device, raging wildly!`,
  "dark_deal_option_2_selected": "Not gonna help a poor fellow out?\nPah!",
  "dark_deal_outro": "After the harrowing encounter,\nyou collect yourself and depart.",

  "sleeping_snorlax_intro_message": `As you walk down a narrow pathway, you see a towering silhouette blocking your path.
  $You get closer to see a Snorlax sleeping peacefully.\nIt seems like there's no way around it.`,
  "sleeping_snorlax_title": "Sleeping Snorlax",
  "sleeping_snorlax_description": "You could attack it to try and get it to move, or simply wait for it to wake up. Who knows how long that could take, though...",
  "sleeping_snorlax_query": "What will you do?",
  "sleeping_snorlax_option_1_label": "Fight it",
  "sleeping_snorlax_option_1_tooltip": "(-) Fight Sleeping Snorlax",
  "sleeping_snorlax_option_2_label": "Wait for it to move",
  "sleeping_snorlax_option_2_tooltip": "@[SUMMARY_BLUE]{(75%) Wait a short time}\n@[SUMMARY_BLUE]{(25%) Wait a long time}",
  "sleeping_snorlax_option_3_label": "Steal its item",
  "sleeping_snorlax_option_3_tooltip": "(+) {{option3PrimaryName}} uses {{option3PrimaryMove}}\n(+) Leftovers",
  "sleeping_snorlax_option_3_disabled_tooltip": "Your Pokémon need to know certain moves to choose this",
  "sleeping_snorlax_option_1_selected_message": "You approach the\nPokémon without fear.",
  "sleeping_snorlax_option_2_selected_message": `.@d{32}.@d{32}.@d{32}
  $You wait for a time, but the Snorlax's yawns make your party sleepy.`,
  "sleeping_snorlax_option_2_good_result": "When you all awaken, the Snorlax is no where to be found - but your Pokémon are all healed!",
  "sleeping_snorlax_option_2_bad_result": `Your {{primaryName}} is still asleep...
  $But on the bright side, the Snorlax left something behind...
  $@s{item_fanfare}You gained a Berry!`,
  "sleeping_snorlax_option_3_good_result": "Your {{option3PrimaryName}} uses {{option3PrimaryMove}}! @s{item_fanfare}It steals Leftovers off the sleeping Snorlax and you make out like bandits!",

  lostAtSea,
} as const;
