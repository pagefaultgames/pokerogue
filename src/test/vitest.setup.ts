import "#app/test/fontFace.setup";
import "vitest-canvas-mock";

import { initLoggedInUser } from "#app/account";
import { initAbilities } from "#app/data/ability";
import { initBiomes } from "#app/data/biomes";
import { initEggMoves } from "#app/data/egg-moves";
import { initMoves } from "#app/data/move";
import { initPokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initAchievements } from "#app/system/achv.js";
import { initVouchers } from "#app/system/voucher.js";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { beforeAll, beforeEach, vi } from "vitest";
import * as overrides from "#app/overrides";
import { initMysteryEncounterDialogue } from "#app/data/mystery-encounters/dialogue/mystery-encounter-dialogue";
import { initMysteryEncounters } from "#app/data/mystery-encounters/mystery-encounters";

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
initLoggedInUser();
initMysteryEncounterDialogue();
initMysteryEncounters();

global.testFailed = false;

beforeAll(() => {
  Object.defineProperty(document, "fonts", {
    writable: true,
    value: {
      add: () => {},
    }
  });
});

// Disables Mystery Encounters on all tests (can be overridden at test level)
beforeEach( () => {
  vi.spyOn(overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(0);
});
