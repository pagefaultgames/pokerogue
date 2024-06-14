import { expect, test } from "vitest";
import * as Overrides from "#app/overrides";
import { WeatherType } from "#enums/weather-type";
import { Biome } from "#enums/biome";
import { Abilities } from "#enums/abilities";
import { StatusEffect } from "#app/data/status-effect";

test("Overrides are not default values", () => {
  const defaultOverrides = {
    ...Overrides, // Any future overrides will be passed through
    SEED_OVERRIDE: "",
    WEATHER_OVERRIDE: WeatherType.NONE,
    DOUBLE_BATTLE_OVERRIDE: false,
    SINGLE_BATTLE_OVERRIDE: false,
    STARTING_WAVE_OVERRIDE: 0,
    STARTING_BIOME_OVERRIDE: Biome.TOWN,
    ARENA_TINT_OVERRIDE: null,
    XP_MULTIPLIER_OVERRIDE: null,
    IMMEDIATE_HATCH_EGGS_OVERRIDE: false,
    STARTING_MONEY_OVERRIDE: 0,
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
    OPP_SPECIES_OVERRIDE: 0,
    OPP_LEVEL_OVERRIDE: 0,
    OPP_ABILITY_OVERRIDE: Abilities.NONE,
    OPP_PASSIVE_ABILITY_OVERRIDE: Abilities.NONE,
    OPP_STATUS_OVERRIDE: StatusEffect.NONE,
    OPP_GENDER_OVERRIDE: null,
    OPP_MOVESET_OVERRIDE: [],
    OPP_SHINY_OVERRIDE: false,
    OPP_VARIANT_OVERRIDE: 0,
    STARTING_MODIFIER_OVERRIDE: [],
    OPP_MODIFIER_OVERRIDE: [],
    STARTING_HELD_ITEMS_OVERRIDE: [],
    OPP_HELD_ITEMS_OVERRIDE: [],
    NEVER_CRIT_OVERRIDE: false,
    ITEM_REWARD_OVERRIDE: [],
  } satisfies typeof Overrides;

  expect(Object.assign({}, Overrides)).toEqual(defaultOverrides);
});
