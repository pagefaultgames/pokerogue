import { StatusEffect } from "#app/data/status-effect";
import * as _Overrides from "#app/overrides";
import { Abilities } from "#enums/abilities";
import { Biome } from "#enums/biome";
import { WeatherType } from "#enums/weather-type";
import { expect, test } from "vitest";

test("Overrides are not default values", () => {
  const defaultOverrides = {
    SEED_OVERRIDE: "",
    WEATHER_OVERRIDE: WeatherType.NONE,
    DOUBLE_BATTLE_OVERRIDE: false,
    SINGLE_BATTLE_OVERRIDE: false,
    STARTING_WAVE_OVERRIDE: 0,
    STARTING_BIOME_OVERRIDE: Biome.TOWN,
    ARENA_TINT_OVERRIDE: null,
    XP_MULTIPLIER_OVERRIDE: null,
    STARTING_MONEY_OVERRIDE: 0,
    FREE_CANDY_UPGRADE_OVERRIDE: false,
    POKEBALL_OVERRIDE: _Overrides.POKEBALL_OVERRIDE, // Pass through pokeballs
    // Player
    STARTER_FORM_OVERRIDES: {},
    STARTING_LEVEL_OVERRIDE: 0,
    STARTER_SPECIES_OVERRIDE: 0,
    ABILITY_OVERRIDE: Abilities.NONE,
    PASSIVE_ABILITY_OVERRIDE: Abilities.NONE,
    STATUS_OVERRIDE: StatusEffect.NONE,
    GENDER_OVERRIDE: null,
    MOVESET_OVERRIDE: [],
    SHINY_OVERRIDE: false,
    VARIANT_OVERRIDE: 0,
    // Opponent
    OPP_SPECIES_OVERRIDE: 0,
    OPP_LEVEL_OVERRIDE: 0,
    OPP_ABILITY_OVERRIDE: Abilities.NONE,
    OPP_PASSIVE_ABILITY_OVERRIDE: Abilities.NONE,
    OPP_STATUS_OVERRIDE: StatusEffect.NONE,
    OPP_GENDER_OVERRIDE: null,
    OPP_MOVESET_OVERRIDE: [],
    OPP_SHINY_OVERRIDE: false,
    OPP_VARIANT_OVERRIDE: 0,
    OPP_IVS_OVERRIDE: [],
    // Eggs
    EGG_IMMEDIATE_HATCH_OVERRIDE: false,
    EGG_TIER_OVERRIDE: null,
    EGG_SHINY_OVERRIDE: false,
    EGG_VARIANT_OVERRIDE: null,
    EGG_FREE_GACHA_PULLS_OVERRIDE: false,
    EGG_GACHA_PULL_COUNT_OVERRIDE: 0,
    // Items
    STARTING_MODIFIER_OVERRIDE: [],
    OPP_MODIFIER_OVERRIDE: [],
    STARTING_HELD_ITEMS_OVERRIDE: [],
    OPP_HELD_ITEMS_OVERRIDE: [],
    NEVER_CRIT_OVERRIDE: false,
    ITEM_REWARD_OVERRIDE: [],
  } satisfies typeof _Overrides;

  const Overrides = Object.assign({}, _Overrides);
  expect(Overrides).toEqual(defaultOverrides);
});
