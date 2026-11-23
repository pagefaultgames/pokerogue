import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Reward } from "#items/reward";

/**
 * Union of all (disjoint) types that can be put in a reward pool.
 */
export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

/** Valid rarity tiers for reward pools. */
export type PoolRarityTier = Exclude<RarityTier, RarityTier.LUXURY>;

/**
 * A dynamic weight for a pool entry.
 * @param rerollCount - The number of rerolls performed during the current reward selection
 */
export type RewardWeightFunc = (rerollCount: number) => number;

/**
 * Config for generation of a single reward.
 */
export type RewardConfiguration = RewardPoolId | Reward;

export interface RewardPoolEntry {
  id: RewardPoolId;
  weight: number | RewardWeightFunc;
  // TODO this is never read
  maxWeight?: number;
}

export type RewardPool = Record<PoolRarityTier, RewardPoolEntry[]>;

/** Resolved entry weights, parallel to the entries of a {@linkcode RewardPool}. */
export type RewardPoolWeights = Record<PoolRarityTier, number[]>;

export type SilentReward =
  | TrainerItemId
  | typeof RewardId.VOUCHER
  | typeof RewardId.VOUCHER_PLUS
  | typeof RewardId.VOUCHER_PREMIUM
  | typeof RewardId.ROGUE_BALL;
