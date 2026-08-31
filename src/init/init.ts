import "#app/extensions"; // Setup Phaser extension methods/etc

import { initAbilities } from "#abilities/init-abilities";
import { initGlobalAudioManager } from "#app/global-audio-manager";
import { initSettingsManager } from "#app/global-settings-manager";
import { initChallenges } from "#data/challenge";
import { initTrainerTypeDialogue } from "#data/dialogue";
import { initSpeciesDataRegistry } from "#data/species-data-registry";
import { initBiomeBgmLoopPoints } from "#init/init-biome-bgm-loop-points";
import { initBiomeDepths } from "#init/init-biome-depths";
import { initBiomes } from "#init/init-biomes";
import { initCatchableSpecies } from "#init/init-catchable-species";
import { initStarterColors } from "#init/init-starter-colors";
import { initHeldItems } from "#items/all-held-items";
import { initTrainerItems } from "#items/all-trainer-items";
import { initHeldItemPools } from "#items/init-held-item-pools";
import { initRewardPools } from "#items/init-reward-pools";
import { initTrainerItemPools } from "#items/init-trainer-item-pools";
import { initMoves } from "#moves/move";
import { initMysteryEncounters } from "#mystery-encounters/mystery-encounter-biomes";
import { initAchievements } from "#system/achv";
import { initVouchers } from "#system/voucher";
import { initStatsKeys } from "#ui/game-stats-ui-handler";

export async function initializeGame(): Promise<void> {
  await initStarterColors();
  initBiomeBgmLoopPoints();
  await initSettingsManager();
  initSpeciesDataRegistry();
  await initGlobalAudioManager();
  initItems();
  initVouchers();
  initAchievements();
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
