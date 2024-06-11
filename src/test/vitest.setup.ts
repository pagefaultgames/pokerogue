import "vitest-canvas-mock";
import "#app/test/fontFace.setup";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { initPokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { initBiomes } from "#app/data/biomes";
import { initEggMoves } from "#app/data/egg-moves";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initMoves } from "#app/data/move";
import { initAbilities } from "#app/data/ability";
import { initAchievements } from "#app/system/achv.js";
import { initVouchers } from "#app/system/voucher.js";
import { beforeAll, vi } from "vitest";

initVouchers();
initAchievements();
initStatsKeys();
initPokemonPrevolutions();
initBiomes();
initEggMoves();
initPokemonForms();
initSpecies();
initMoves();
initAbilities();

beforeAll(() => {
  vi.mock("../overrides", async (importOriginal) => {
    const Overrides = await importOriginal<typeof import("../overrides")>();

    return {
      ...Overrides,
      SEED_OVERRIDE: "",
      WEATHER_OVERRIDE: 0,
      DOUBLE_BATTLE_OVERRIDE: false,
      SINGLE_BATTLE_OVERRIDE: false,
      STARTING_WAVE_OVERRIDE: 0,
      STARTING_BIOME_OVERRIDE: 0,
      ARENA_TINT_OVERRIDE: null,
      XP_MULTIPLIER_OVERRIDE: null,
      IMMEDIATE_HATCH_EGGS_OVERRIDE: false,
      STARTING_MONEY_OVERRIDE: 0,
      STARTER_FORM_OVERRIDE: 0,
      STARTING_LEVEL_OVERRIDE: 0,
      STARTER_SPECIES_OVERRIDE: 0,
      ABILITY_OVERRIDE: 0,
      PASSIVE_ABILITY_OVERRIDE: 0,
      STATUS_OVERRIDE: 0,
      GENDER_OVERRIDE: null,
      MOVESET_OVERRIDE: [],
      SHINY_OVERRIDE: false,
      VARIANT_OVERRIDE: 0,
      OPP_SPECIES_OVERRIDE: 0,
      OPP_LEVEL_OVERRIDE: 0,
      OPP_ABILITY_OVERRIDE: 0,
      OPP_PASSIVE_ABILITY_OVERRIDE: 0,
      OPP_STATUS_OVERRIDE: 0,
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
  });
});

global.testFailed = false;
