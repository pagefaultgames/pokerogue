import { PrestigeTranslationEntries } from "#app/plugins/i18n.js";

export const prestige: PrestigeTranslationEntries = {
  attributes: {
    "no_modifier": "No modifier",
    "wild_pokemon_attack": "Wild Pokémon Attack {{modifier}}",
    "wild_pokemon_defense": "Wild Pokémon Defense {{modifier}}",
    "wild_pokemon_speed": "Wild Pokémon Speed {{modifier}}",
    "trainer_pokemon_attack": "Trainer Pokémon Attack {{modifier}}",
    "trainer_pokemon_defense": "Trainer Pokémon Defense {{modifier}}",
    "trainer_pokemon_speed": "Trainer Pokémon Speed {{modifier}}",
    "shop_item_prices": "Shop Item Prices {{modifier}}",
    "pokemon_exp_gain": "Pokémon EXP Gain {{modifier}}",
    "party_luck": "Party Luck {{modifier}}",
    "start_party_points": "Start Party Points {{modifier}}"
  },
  operations: {
    add: {
      "+": "+ {{value}}",
      "-": "- {{value}}"
    },
    multiply: {
      "+": "+ {{value}}%",
      "-": "- {{value}}%"
    }
  }
} as const;
