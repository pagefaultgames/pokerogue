import "#app/extensions"; // Setup Phaser extension methods/etc

import { initAbilities } from "#abilities/init-abilities";
import { initChallenges } from "#data/challenge";
import { initTrainerTypeDialogue } from "#data/dialogue";
import { initSpeciesDataRegistry } from "#data/species-data-registry";
import { initBiomeBgmLoopPoints } from "#init/init-biome-bgm-loop-points";
import { initBiomeDepths } from "#init/init-biome-depths";
import { initBiomes } from "#init/init-biomes";
import { initCatchableSpecies } from "#init/init-catchable-species";
import { initModifierPools } from "#modifiers/init-modifier-pools";
import { initModifierTypes } from "#modifiers/modifier-type";
import { initMoves } from "#moves/move";
import { initMysteryEncounters } from "#mystery-encounters/mystery-encounters";
import { initAchievements } from "#system/achv";
import { initVouchers } from "#system/voucher";
import { initStatsKeys } from "#ui/game-stats-ui-handler";

export function initializeGame() {
  initBiomeBgmLoopPoints();
  initSpeciesDataRegistry();
  initModifierTypes();
  initModifierPools();
  initAchievements();
  initVouchers();
  initStatsKeys();
  initBiomes();
  initCatchableSpecies();
  initBiomeDepths();
  initTrainerTypeDialogue();
  initMoves();
  initAbilities();
  initChallenges();
  initMysteryEncounters();
}
