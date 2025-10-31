import { initAbilities } from "#abilities/ability";
import { initBiomes } from "#balance/init-biomes";
import { initPokemonPrevolutions, initPokemonStarters } from "#balance/pokemon-evolutions";
import { initSpecies } from "#balance/pokemon-species";
import { initChallenges } from "#data/challenge";
import { initTrainerTypeDialogue } from "#data/dialogue";
import { initPokemonForms } from "#data/pokemon-forms";
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

/** Initialize the game. */
export function initializeGame() {
  initItems();
  initVouchers();
  initAchievements();
  initStatsKeys();
  initPokemonPrevolutions();
  initPokemonStarters();
  initBiomes();
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
