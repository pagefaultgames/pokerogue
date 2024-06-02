import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**Encounter descriptions should be about 7-9 words long per line, meaning 3 lines (21-27 words) are usually best to formulate the situation.
*/

export const mysteryEncounter: SimpleTranslationEntries = {
  "encounter_0": "Mysterious challengers have appeared!",
  "encounter_0_id": "Mysterious Challenger",
  "encounter_0_description": "If you defeat a challenger, you might impress them enough to receive a boon. If you lose, they might not be so kind.",
  "encounter_0_query": "Who will you battle?",
  "encounter_0_option_1": "A weak, but clever foe",
  "encounter_0_option_2": "A strong foe",
  "encounter_0_option_3": "The mightiest foe",
  "encounter_0_option_4": "Leave",

  "encounter_1": "You keep going, you find... a chest?",
  "encounter_1_id": "A mysterious chest",
  "encounter_1_description": "A beautifully ornamented chest stands on the ground. It seems to be full of mystery.",
  "encounter_1_query": "Will you open it?",
  "encounter_1_option_1": "Open it",
  "encounter_1_option_2": "It might be dangerous, better leave it alone",
  "encounter_1_option_3": "",
  "encounter_1_option_4": "",

  "encounter_2": "A Shedinja stands in your way, but, this one seems different?",
  "encounter_2_id": "Cursed Deal",
  "encounter_2_description": "Bzzzz, bzzzz... \nIt wants you to say yes or no.",
  "encounter_2_query": "What will you do?",
  "encounter_2_option_1": "Accept", // Give player a master ball. Remove a random Pokémon from player's party. Fight a legendary Pokémon.
  "encounter_2_option_2": "Refuse",
  "encounter_2_option_3": "",
  "encounter_2_option_4": "",

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
