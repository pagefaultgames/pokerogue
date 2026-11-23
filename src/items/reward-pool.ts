import { globalScene } from "#app/global-scene";
import { isHeldItemId, isTrainerItemId } from "#enums/reward-id";
import type { PoolRarityTier } from "#enums/reward-tier";
import { allRewards } from "#items/all-rewards";
import { createTieredRecord, isPoolRarityTier, POOL_RARITY_TIERS, rollRarityTier } from "#items/rarity-tier-utils";
import { Reward, RewardGenerator, RewardOption } from "#items/reward";
import { getDefaultRewardTier, getRewardConfigId } from "#items/reward-utils";
import type {
  RewardGenerationOptions,
  RewardPoolEntries,
  RewardPoolEntry,
  RewardPoolId,
  RewardWeightFunc,
} from "#types/rewards";
import { randSeedInt } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import { weightedPick } from "#utils/random";
import { HeldItemReward, isHeldItemRewardAvailable } from "./rewards/held-item-reward";
import { TrainerItemReward } from "./rewards/trainer-item-reward";

/**
 * Retry order for tiers without valid entries - steps down to common, then up from the initial tier to master.
 * @param initialTier - The tier to start from
 */
function getTierSearchOrder(initialTier: PoolRarityTier): PoolRarityTier[] {
  const index = POOL_RARITY_TIERS.indexOf(initialTier);
  return [...POOL_RARITY_TIERS.slice(0, index + 1).reverse(), ...POOL_RARITY_TIERS.slice(index + 1)];
}

// #region Weights and availability

/** Positive, resolved weights of a pool's entries for a working generation session. */
type WorkingRewardWeights = Record<PoolRarityTier, Map<RewardPoolEntry, number>>;

/**
 * @param weight - The entry's static or dynamic weight
 * @param rerollCount - The number of rerolls performed so far
 * @returns The numeric weight for the reward
 */
function resolveWeight(weight: number | RewardWeightFunc, rerollCount: number): number {
  return typeof weight === "number" ? weight : weight(rerollCount);
}

function getGenerator(id: RewardPoolId): RewardGenerator | null {
  if (isHeldItemId(id) || isTrainerItemId(id)) {
    return null;
  }
  const entry = allRewards[id];
  return entry instanceof RewardGenerator ? entry : null;
}

/**
 * Check if a reward pool entry is available for selection given active exclusions.
 * @param id - Pool entry ID
 * @param exclusions - Optional set of match keys to exclude
 * @returns True if available, false if excluded or exhausted
 */
function isPoolEntryAvailable(id: RewardPoolId, selectedRewards?: readonly Reward[]): boolean {
  if (isHeldItemId(id)) {
    return isHeldItemRewardAvailable(id, globalScene.getPlayerParty());
  }
  if (isTrainerItemId(id)) {
    return !globalScene.trainerItems.isMaxStack(id);
  }
  const generator = getGenerator(id);
  if (generator) {
    return generator.getCapacity(selectedRewards) > 0;
  }
  return true;
}

function initWeightMap(entries: Record<PoolRarityTier, RewardPoolEntry[]>, rerollCount: number): WorkingRewardWeights {
  return createTieredRecord(tier => {
    const weights = new Map<RewardPoolEntry, number>();
    for (const entry of entries[tier]) {
      if (isPoolEntryAvailable(entry.id)) {
        const weight = resolveWeight(entry.weight, rerollCount);
        if (weight > 0) {
          weights.set(entry, weight);
        }
      }
    }
    return weights;
  });
}

/**
 * Check whether a tier exists in the pool and has at least one entry with positive weight.
 * @param weights - The working pool weights
 * @param tier - The tier to check
 */
function hasRollableEntries(weights: WorkingRewardWeights, tier: number): boolean {
  return isPoolRarityTier(tier) && weights[tier].size > 0;
}

/**
 * Determines the number of tier upgrades for a given rarity tier, based on the party luck.
 * Will not upgrade into a tier that has no rollable entries.
 * @param weights - The working weights of the pool being rolled from
 * @param baseTier - The initial tier to upgrade
 * @returns The number of tiers to upgrade by
 */
function getRarityUpgradeCount(weights: WorkingRewardWeights, baseTier: PoolRarityTier): number {
  const upgradeOdds = Math.floor(128 / ((getPartyLuckValue() + 4) / 4));
  let upgradeCount = 0;
  while (hasRollableEntries(weights, baseTier + upgradeCount + 1) && randSeedInt(upgradeOdds) < 4) {
    upgradeCount++;
  }
  return upgradeCount;
}

/**
 * Resolve a pool entry ID into a {@linkcode Reward} instance.
 * @param id - The pool entry ID to resolve
 * @param selectedRewards - Already selected rewards to exclude during generation
 * @returns The resolved reward, or `null` if the entry cannot produce a reward
 */
function resolveEntryToReward(id: RewardPoolId, selectedRewards: readonly Reward[] = []): Reward | null {
  if (isHeldItemId(id)) {
    return new HeldItemReward(id);
  }
  if (isTrainerItemId(id)) {
    return new TrainerItemReward(id);
  }
  const generator = getGenerator(id);
  if (generator) {
    return generator.generateRandomReward(selectedRewards);
  }
  return (allRewards[id] as Reward) ?? null;
}

/**
 * Pick a random entry from a tier and create a {@linkcode RewardOption}.
 * @param weights - The working pool weights
 * @param selectedRewards - Already selected rewards to exclude during generation
 * @param tier - The tier to pick from
 * @param upgradeCount - The number of tier upgrades applied
 * @returns The created option, or `null` if no rollable entries remain in the tier
 */
function pickFromTier(
  weights: WorkingRewardWeights,
  selectedRewards: Reward[],
  tier: PoolRarityTier,
  upgradeCount: number,
): RewardOption | null {
  const candidates = weights[tier];
  if (candidates.size === 0) {
    return null;
  }
  const pickedEntry = weightedPick(candidates);
  const reward = resolveEntryToReward(pickedEntry.id, selectedRewards);
  if (!reward) {
    candidates.delete(pickedEntry);
    return pickFromTier(weights, selectedRewards, tier, upgradeCount);
  }

  selectedRewards.push(reward);

  const generator = getGenerator(pickedEntry.id);
  if (generator == null || generator.getCapacity(selectedRewards) === 0) {
    // This also removes selected non-generators, as `getGenerator` is `null` in that case
    candidates.delete(pickedEntry);
  }

  return new RewardOption(reward, upgradeCount, tier);
}

/**
 * Roll a reward option, upgrading tiers with luck and falling back across tiers.
 * @param weights - The working pool weights
 * @param selectedRewards - Already selected rewards to exclude during generation
 * @param baseTier - Initial rarity tier, rolled randomly if omitted
 * @param enableLuckUpgrades - Whether luck can upgrade the tier
 * @returns The created option, or `null` if the pool is exhausted
 */
function pickOption(
  weights: WorkingRewardWeights,
  selectedRewards: Reward[],
  baseTier: PoolRarityTier = rollRarityTier(),
  enableLuckUpgrades = true,
): RewardOption | null {
  const upgradeCount = enableLuckUpgrades ? getRarityUpgradeCount(weights, baseTier) : 0;
  const initialTier = (baseTier + upgradeCount) as PoolRarityTier;

  for (const tier of getTierSearchOrder(initialTier)) {
    const option = pickFromTier(weights, selectedRewards, tier, tier === initialTier ? upgradeCount : 0);
    if (option) {
      return option;
    }
  }
  return null;
}

/**
 * Remove any entries matching the given reward or exhausted generators from working weights.
 * @param weights - The working pool weights
 * @param reward - The reward to remove matching entries for
 * @param selectedRewards - Already selected rewards
 *
 * @remarks
 * This is not intended to be used retroactively for regular selections
 * (this can be done immediately, see {@linkcode pickFromTier}), but rather for situations like custom
 * settings where we don't have an entry to point to.
 */
function removeRewardFromWeights(
  weights: WorkingRewardWeights,
  reward: Reward,
  selectedRewards: readonly Reward[],
): void {
  for (const tier of POOL_RARITY_TIERS) {
    for (const entry of weights[tier].keys()) {
      if (entry.id === reward.id) {
        weights[tier].delete(entry);
      } else {
        const generator = getGenerator(entry.id);
        if (generator && generator.getCapacity(selectedRewards) === 0) {
          weights[tier].delete(entry);
        }
      }
    }
  }
}

// #endregion Weights and availability

/**
 * A weighted, tiered collection of {@linkcode RewardPoolEntry | pool entries} from which
 * {@linkcode RewardOption}s are generated.
 *
 * Entries are static data (IDs and weights), with everything that depends on game state being resolved
 * inside {@linkcode generateOptions}. A pool is therefore stateless and can be freely
 * shared, copied or edited between selections.
 */
export class RewardPool {
  private readonly entries: Record<PoolRarityTier, RewardPoolEntry[]>;

  constructor(entries: RewardPoolEntries = {}) {
    this.entries = createTieredRecord(tier => [...(entries[tier] ?? [])]);
  }

  /**
   * Replace the entries of every tier. Tiers omitted from `entries` are emptied.
   * @param entries - The new entries, keyed by tier
   * @returns `this`
   */
  public setEntries(entries: RewardPoolEntries): this {
    for (const tier of POOL_RARITY_TIERS) {
      this.entries[tier] = [...(entries[tier] ?? [])];
    }
    return this;
  }

  // #region Generation

  /**
   * Generate reward options from this pool.
   *
   * @param count - The number of options to generate (ignored by `customSettings` unless `fillRemaining` is set)
   * @param options - See {@linkcode RewardGenerationOptions}
   * @returns The generated options
   */
  public generateOptions(count: number, options: RewardGenerationOptions = {}): RewardOption[] {
    const { rerollCount = 0, lockedTiers, customSettings } = options;
    const selectedRewards: Reward[] = [];

    // Active weights for a generation session (modified for dedup purposes)
    const workingWeights: WorkingRewardWeights = initWeightMap(this.entries, rerollCount);

    const result: RewardOption[] = [];

    if (!customSettings) {
      for (let i = 0; i < count; i++) {
        const option = pickOption(workingWeights, selectedRewards, lockedTiers?.[i]);
        if (!option) {
          break;
        }
        result.push(option);
      }
      return result;
    }

    const {
      guaranteedRewardOptions = [],
      guaranteedRewardConfigs = [],
      guaranteedRarityTiers = [],
      fillRemaining = false,
      allowLuckUpgrades = true,
    } = customSettings;

    for (const option of guaranteedRewardOptions) {
      result.push(option);
      selectedRewards.push(option.reward);
      removeRewardFromWeights(workingWeights, option.reward, selectedRewards);
    }

    for (const config of guaranteedRewardConfigs) {
      const reward = config instanceof Reward ? config : resolveEntryToReward(config, selectedRewards);
      if (reward) {
        const id = getRewardConfigId(config);
        result.push(new RewardOption(reward, 0, getDefaultRewardTier(id)));
        selectedRewards.push(reward);
        removeRewardFromWeights(workingWeights, reward, selectedRewards);
      }
    }

    for (const tier of guaranteedRarityTiers) {
      const option = pickOption(workingWeights, selectedRewards, tier, allowLuckUpgrades);
      if (option) {
        result.push(option);
      }
    }

    if (fillRemaining) {
      while (result.length < count) {
        const option = pickOption(workingWeights, selectedRewards);
        if (!option) {
          break;
        }
        result.push(option);
      }
    }

    return result;
  }

  // #endregion Generation
}

/** The pool the player draws from during reward selection. Populated by `initRewardPools`. */
export const playerRewardPool = new RewardPool();
