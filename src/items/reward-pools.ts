/*
 * Contains the reward pool and its resolved weights.
 * Can be safely imported without worrying about circular dependencies.
 */

import { RarityTier } from "#enums/reward-tier";
import type { PoolRarityTier, RewardPool, RewardPoolWeights } from "#types/rewards";

/** Every {@linkcode PoolRarityTier} in ascending rarity order. */
export const POOL_RARITY_TIERS = [
  RarityTier.COMMON,
  RarityTier.GREAT,
  RarityTier.ULTRA,
  RarityTier.ROGUE,
  RarityTier.MASTER,
] as const satisfies readonly PoolRarityTier[];

function createEmptyRewardPool() {
  return {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
  };
}

export const rewardPool: RewardPool = createEmptyRewardPool();
export const rewardPoolWeights: RewardPoolWeights = createEmptyRewardPool();
