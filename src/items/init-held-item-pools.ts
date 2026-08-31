import { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { RarityTier } from "#enums/reward-tier";
import { dailyStarterHeldItemPool, trainerHeldItemPool, wildHeldItemPool } from "#items/held-item-pool";

/**
 * Initialize the wild held item pool
 */
function initWildHeldItemPool() {
  wildHeldItemPool[RarityTier.COMMON] = [{ entry: HeldItemCategoryId.BERRY, weight: 1 }];
  wildHeldItemPool[RarityTier.GREAT] = [{ entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 1 }];
  wildHeldItemPool[RarityTier.ULTRA] = [
    { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 },
    { entry: HeldItemId.WHITE_HERB, weight: 0 },
  ];
  wildHeldItemPool[RarityTier.ROGUE] = [{ entry: HeldItemId.LUCKY_EGG, weight: 4 }];
  wildHeldItemPool[RarityTier.MASTER] = [{ entry: HeldItemId.GOLDEN_EGG, weight: 1 }];
}

/**
 * Initialize the trainer pokemon held item pool
 */
function initTrainerHeldItemPool() {
  trainerHeldItemPool[RarityTier.COMMON] = [
    { entry: HeldItemCategoryId.BERRY, weight: 8 },
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 3 },
  ];
  trainerHeldItemPool[RarityTier.GREAT] = [{ entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 3 }];
  trainerHeldItemPool[RarityTier.ULTRA] = [
    { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 10 },
    { entry: HeldItemId.WHITE_HERB, weight: 0 },
  ];
  trainerHeldItemPool[RarityTier.ROGUE] = [
    { entry: HeldItemId.FOCUS_BAND, weight: 2 },
    { entry: HeldItemId.LUCKY_EGG, weight: 4 },
    { entry: HeldItemId.QUICK_CLAW, weight: 1 },
    { entry: HeldItemId.GRIP_CLAW, weight: 1 },
    { entry: HeldItemId.WIDE_LENS, weight: 1 },
  ];
  trainerHeldItemPool[RarityTier.MASTER] = [
    { entry: HeldItemId.KINGS_ROCK, weight: 1 },
    { entry: HeldItemId.LEFTOVERS, weight: 1 },
    { entry: HeldItemId.SHELL_BELL, weight: 1 },
    { entry: HeldItemId.SCOPE_LENS, weight: 1 },
  ];
}

/**
 * Initialize the daily starter held item pool
 */
function initDailyStarterRewardPool() {
  dailyStarterHeldItemPool[RarityTier.COMMON] = [
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 1 },
    { entry: HeldItemCategoryId.BERRY, weight: 3 },
  ];
  dailyStarterHeldItemPool[RarityTier.GREAT] = [{ entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 }];
  dailyStarterHeldItemPool[RarityTier.ULTRA] = [
    { entry: HeldItemId.REVIVER_SEED, weight: 4 },
    { entry: HeldItemId.SOOTHE_BELL, weight: 1 },
    { entry: HeldItemId.SOUL_DEW, weight: 1 },
    { entry: HeldItemId.GOLDEN_PUNCH, weight: 1 },
  ];
  dailyStarterHeldItemPool[RarityTier.ROGUE] = [
    { entry: HeldItemId.GRIP_CLAW, weight: 5 },
    { entry: HeldItemId.BATON, weight: 2 },
    { entry: HeldItemId.FOCUS_BAND, weight: 5 },
    { entry: HeldItemId.QUICK_CLAW, weight: 3 },
    { entry: HeldItemId.KINGS_ROCK, weight: 3 },
  ];
  dailyStarterHeldItemPool[RarityTier.MASTER] = [
    { entry: HeldItemId.LEFTOVERS, weight: 1 },
    { entry: HeldItemId.SHELL_BELL, weight: 1 },
  ];
}

export function initHeldItemPools() {
  // Default held item pools for specific scenarios
  initWildHeldItemPool();
  initTrainerHeldItemPool();
  initDailyStarterRewardPool();
}
