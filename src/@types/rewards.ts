import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { PoolRarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Reward, RewardOption } from "#items/reward";

/**
 * Union of all (disjoint) types that can be put in a reward pool.
 */
export type RewardPoolId = RewardId | HeldItemId | TrainerItemId;

/**
 * @param rerollCount - The number of rerolls performed during the current reward selection
 */
export type RewardWeightFunc = (rerollCount: number) => number;

/**
 * Config for generation of a single reward.
 */
export type RewardConfiguration = RewardPoolId | Reward;

// #region Pools

/** A single weighted entry of a reward pool tier. */
export interface RewardPoolEntry {
  readonly id: RewardPoolId;
  readonly weight: number | RewardWeightFunc;
}

/** Entries for a reward pool, keyed by tier. Omitted tiers are treated as empty. */
export type RewardPoolEntries = Partial<Record<PoolRarityTier, readonly RewardPoolEntry[]>>;

/** Settings used to fix part (or all) of a reward selection ahead of time, e.g. by mystery encounters. */
export interface CustomRewardSettings {
  /** Tiers to roll one option from each, in order. */
  guaranteedRarityTiers?: PoolRarityTier[];
  /** Pre-built options to include directly. */
  guaranteedRewardOptions?: RewardOption[];
  /** Rewards to generate directly by configuration. */
  guaranteedRewardConfigs?: RewardConfiguration[];
  /**
   * If set to `true`, fill the remainder of shop items that were not overridden by the 3 options above, up to the `count` param value.
   * @example
   * ```ts
   * count = 4;
   * customRewardSettings = { guaranteedRarityTiers: [RarityTier.GREAT], fillRemaining: true };
   * ```
   * The first item in the shop will be `GREAT` tier, and the remaining `3` items will be generated normally.
   *
   * If `fillRemaining: false` in the same scenario, only 1 `GREAT` tier item will appear in the shop (regardless of the value of `count`).
   * @defaultValue `false`
   */
  fillRemaining?: boolean;
  /** If specified, adjusts the amount of money required for a shop reroll. If set to a negative value, the shop will not allow rerolls at all. */
  rerollMultiplier?: number;
  /**
   * If `false`, prevent set item tiers from upgrading via luck.
   * @defaultValue `true`
   */
  allowLuckUpgrades?: boolean;
}

/** Options controlling a single call to `RewardPool.generateOptions`. */
export interface RewardGenerationOptions {
  /**
   * The number of rerolls performed during the current reward selection (to pass to weight functions).
   * @defaultValue `0`
   */
  rerollCount?: number;
  /**
   * Per-slot tiers to roll from (used for Lock Capsule), `undefined` slots are rolled randomly.
   * Ignored if `customSettings` is provided.
   */
  lockedTiers?: readonly (PoolRarityTier | undefined)[] | undefined;
  /** @see {@linkcode CustomRewardSettings}. */
  customSettings?: CustomRewardSettings | undefined;
}

// #endregion Pools

export type SilentReward =
  | TrainerItemId
  | typeof RewardId.VOUCHER
  | typeof RewardId.VOUCHER_PLUS
  | typeof RewardId.VOUCHER_PREMIUM
  | typeof RewardId.ROGUE_BALL;
