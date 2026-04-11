import "#app/extensions"; // Setup Phaser extension methods/etc

import { initAbilities } from "#abilities/init-abilities";
import { initPokemonPrevolutions, initPokemonStarters } from "#balance/pokemon-evolutions";
import { initSpecies } from "#balance/pokemon-species";
import { initChallenges } from "#data/challenge";
import { initTrainerTypeDialogue } from "#data/dialogue";
import { initPokemonForms } from "#data/pokemon-forms";
import { initBiomeBgmLoopPoints } from "#init/init-biome-bgm-loop-points";
import { initBiomeDepths } from "#init/init-biome-depths";
import { initBiomes } from "#init/init-biomes";
import { initCatchableSpecies } from "#init/init-catchable-species";
import { initHeldItems } from "#items/all-held-items";
import { initTrainerItems } from "#items/all-trainer-items";
import { initHeldItemPools } from "#items/init-held-item-pools";
import { initRewardPools } from "#items/init-reward-pools";
import { initTrainerItemPools } from "#items/init-trainer-item-pools";
import { initMoves } from "#moves/move";
import { initMysteryEncounters } from "#mystery-encounters/mystery-encounters";
import { initAchievements } from "#system/achv";
import { initVouchers } from "#system/voucher";
import { initStatsKeys } from "#ui/game-stats-ui-handler";

export function initializeGame() {
  initBiomeBgmLoopPoints();
  initItems();
  initVouchers();
  initAchievements();
  initStatsKeys();
  initPokemonPrevolutions();
  initPokemonStarters();
  initBiomes();
  initCatchableSpecies();
  initBiomeDepths();
  initPokemonForms();
  initTrainerTypeDialogue();
  initSpecies();
  initMoves();
  initAbilities();
  initChallenges();
  initMysteryEncounters();
}

/**
 * Sub-method to initialize all the item-related code.
 */
function initItems() {
  initHeldItems();
  initHeldItemPools();
  initTrainerItems();
  initTrainerItemPools();
  initRewardPools();
}
