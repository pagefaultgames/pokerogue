import { globalScene } from "#app/global-scene";
import { isHeldItemId, isTrainerItemId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { allRewards } from "#items/all-rewards";
import { Reward, RewardGenerator, RewardOption } from "#items/reward";
import { createRewardFromSpecs, getDefaultRewardTier } from "#items/reward-utils";
import type {
  PoolRarityTier,
  RewardConfiguration,
  RewardGenerationOptions,
  RewardPoolEntries,
  RewardPoolEntry,
  RewardPoolId,
  RewardWeightFunc,
} from "#types/rewards";
import { randSeedInt } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import { weightedPick } from "#utils/random";
import { isHeldItemRewardAvailable } from "./rewards/held-item-reward";

// #region Tier helpers

/** Every {@linkcode PoolRarityTier} in ascending rarity order. */
export const POOL_RARITY_TIERS = [
  RarityTier.COMMON,
  RarityTier.GREAT,
  RarityTier.ULTRA,
  RarityTier.ROGUE,
  RarityTier.MASTER,
] as const satisfies readonly PoolRarityTier[];

/**
 * @param tier - The tier to check
 * @returns Whether the numeric tier is a valid reward pool tier
 */
export function isPoolRarityTier(tier: number): tier is PoolRarityTier {
  return (POOL_RARITY_TIERS as readonly number[]).includes(tier);
}

/** Create a record with one value per {@linkcode PoolRarityTier}. */
function createTieredRecord<T>(init: (tier: PoolRarityTier) => T): Record<PoolRarityTier, T> {
  return {
    [RarityTier.COMMON]: init(RarityTier.COMMON),
    [RarityTier.GREAT]: init(RarityTier.GREAT),
    [RarityTier.ULTRA]: init(RarityTier.ULTRA),
    [RarityTier.ROGUE]: init(RarityTier.ROGUE),
    [RarityTier.MASTER]: init(RarityTier.MASTER),
  };
}

/**
 * Generates a random RarityTier to draw rewards from the pool. The probabilities are:
 * 1/1024 (Master tier)
 * 12/1024 (Rogue tier)
 * 48/1024 (Ultra tier)
 * 195/1024 (Great tier)
 * 768/1024 (Common tier)
 * @returns The rolled {@linkcode PoolRarityTier}
 */
function randomBaseTier(): PoolRarityTier {
  const tierValue = randSeedInt(1024);

  if (tierValue > 255) {
    return RarityTier.COMMON;
  }
  if (tierValue > 60) {
    return RarityTier.GREAT;
  }
  if (tierValue > 12) {
    return RarityTier.ULTRA;
  }
  if (tierValue) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
}

/**
 * Retry order for tiers without valid entries - steps down to common, then up from the initial tier to master.
 * @param initialTier - The tier to start from
 */
function getTierSearchOrder(initialTier: PoolRarityTier): PoolRarityTier[] {
  const index = POOL_RARITY_TIERS.indexOf(initialTier);
  return [...POOL_RARITY_TIERS.slice(0, index + 1).reverse(), ...POOL_RARITY_TIERS.slice(index + 1)];
}

// #endregion Tier helpers

// #region Weights and availability

/** Positive, resolved weights of a pool's entries for a single generation. */
type ResolvedRewardWeights = Readonly<Record<PoolRarityTier, ReadonlyMap<RewardPoolEntry, number>>>;

/**
 * @param weight - The entry's static or dynamic weight
 * @param rerollCount - The number of rerolls performed so far
 * @returns The numeric weight for the reward
 */
function resolveWeight(weight: number | RewardWeightFunc, rerollCount: number): number {
  return typeof weight === "number" ? weight : weight(rerollCount);
}

/**
 * Check if a reward pool entry is available for selection given active exclusions.
 * @param id - Pool entry ID
 * @param exclusions - Optional set of match keys to exclude
 * @returns True if available, false if excluded or exhausted
 */
function isPoolEntryAvailable(id: RewardPoolId, exclusions?: ReadonlySet<string>): boolean {
  if (isHeldItemId(id)) {
    return isHeldItemRewardAvailable(id, globalScene.getPlayerParty(), exclusions);
  }
  if (isTrainerItemId(id)) {
    return !globalScene.trainerItems.isMaxStack(id) && !exclusions?.has(Reward.getMatchKey(id));
  }
  const entry = allRewards[id];
  if (entry instanceof RewardGenerator) {
    return entry.getCapacity(exclusions) > 0;
  }
  // Use the registered reward's own key, since some rewards (e.g. lures) are keyed by the item they grant
  // rather than by the `RewardId` they are registered under
  return !exclusions?.has(entry.matchKey);
}

/**
 * Check whether a tier exists in the pool and has at least one entry with positive weight.
 * @param weights - The resolved pool weights
 * @param tier - The tier to check
 */
function hasRollableEntries(weights: ResolvedRewardWeights, tier: number): boolean {
  return isPoolRarityTier(tier) && weights[tier].size > 0;
}

/**
 * Determines the number of tier upgrades for a given rarity tier, based on the party luck.
 * Will not upgrade into a tier that has no rollable entries.
 * @param weights - The resolved weights of the pool being rolled from
 * @param baseTier - The initial tier to upgrade
 * @returns The number of tiers to upgrade by
 */
function getRarityUpgradeCount(weights: ResolvedRewardWeights, baseTier: PoolRarityTier): number {
  const upgradeOdds = Math.floor(128 / ((getPartyLuckValue() + 4) / 4));
  let upgradeCount = 0;
  while (hasRollableEntries(weights, baseTier + upgradeCount + 1) && randSeedInt(upgradeOdds) < 4) {
    upgradeCount++;
  }
  return upgradeCount;
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
    const weights = this.resolveWeights(rerollCount);
    const exclusions = new Set<string>();
    const result: RewardOption[] = [];

    if (!customSettings) {
      for (let i = 0; i < count; i++) {
        const option = this.pickOption(weights, exclusions, lockedTiers?.[i]);
        if (!option) {
          break;
        }
        result.push(option);
      }
      return result;
    }

    const {
      guaranteedRewardOptions = [],
      guaranteedRewardSpecs = [],
      guaranteedRarityTiers = [],
      fillRemaining = false,
      allowLuckUpgrades = true,
    } = customSettings;

    for (const option of guaranteedRewardOptions) {
      result.push(option);
      exclusions.add(option.type.matchKey);
    }

    for (const specs of guaranteedRewardSpecs) {
      const id = typeof specs === "object" ? specs.id : specs;
      const option = this.createOption(specs, getDefaultRewardTier(id), 0, exclusions);
      if (option) {
        result.push(option);
      }
    }

    for (const tier of guaranteedRarityTiers) {
      const option = this.pickOption(weights, exclusions, tier, allowLuckUpgrades);
      if (option) {
        result.push(option);
      }
    }

    if (fillRemaining) {
      while (result.length < count) {
        const option = this.pickOption(weights, exclusions);
        if (!option) {
          break;
        }
        result.push(option);
      }
    }

    return result;
  }

  /**
   * Resolve the weight of every entry against the current game state, keeping only positive ones.
   * @param rerollCount - The number of rerolls performed so far
   */
  private resolveWeights(rerollCount: number): ResolvedRewardWeights {
    return createTieredRecord(tier => {
      const weights = new Map<RewardPoolEntry, number>();
      for (const entry of this.entries[tier]) {
        const weight = isPoolEntryAvailable(entry.id) ? resolveWeight(entry.weight, rerollCount) : 0;
        if (weight > 0) {
          weights.set(entry, weight);
        }
      }
      return weights;
    });
  }

  /**
   * Generate one option, starting from `baseTier` (upgraded by luck if allowed) and falling back to
   * other tiers if it has no valid entries.
   * @param weights - The resolved weights for this generation
   * @param exclusions - Match keys to exclude and add the picked option's key to
   * @param baseTier - The tier to start from (random if omitted)
   * @param allowLuckUpgrades - Whether the tier may be upgraded via luck
   * @returns The generated option, or `null` if no valid entries remain in any tier
   */
  private pickOption(
    weights: ResolvedRewardWeights,
    exclusions: Set<string>,
    baseTier: PoolRarityTier = randomBaseTier(),
    allowLuckUpgrades = true,
  ): RewardOption | null {
    const upgradeCount = allowLuckUpgrades ? getRarityUpgradeCount(weights, baseTier) : 0;
    // `getRarityUpgradeCount` only ever upgrades into existing pool tiers
    const initialTier = (baseTier + upgradeCount) as PoolRarityTier;

    for (const tier of getTierSearchOrder(initialTier)) {
      const option = this.pickFromTier(weights, exclusions, tier, tier === initialTier ? upgradeCount : 0);
      if (option) {
        return option;
      }
    }
    return null;
  }

  /**
   * Pick one option from a specific tier.
   * @param weights - The resolved weights for this generation
   * @param exclusions - Match keys to exclude and add the picked option's key to
   * @param tier - The tier to roll from
   * @param upgradeCount - Tier upgrades having occurred
   * @returns The generated option, or `null` if the tier has no valid entries
   */
  private pickFromTier(
    weights: ResolvedRewardWeights,
    exclusions: Set<string>,
    tier: PoolRarityTier,
    upgradeCount: number,
  ): RewardOption | null {
    const candidates = new Map<RewardPoolEntry, number>();
    for (const [entry, weight] of weights[tier]) {
      if (isPoolEntryAvailable(entry.id, exclusions)) {
        candidates.set(entry, weight);
      }
    }
    if (candidates.size === 0) {
      return null;
    }
    return this.createOption(weightedPick(candidates).id, tier, upgradeCount, exclusions);
  }

  /**
   * Resolve a {@linkcode RewardConfiguration} into an option and register it in the exclusion set.
   * @param specs - The specs to resolve
   * @param tier - The tier the option is presented with
   * @param upgradeCount - Tier upgrades having occurred
   * @param exclusions - Match keys to exclude and add the picked option's key to
   * @returns The created option, or `null` if `specs` names a generator with no available variants
   */
  private createOption(
    specs: RewardConfiguration,
    tier: RarityTier,
    upgradeCount: number,
    exclusions: Set<string>,
  ): RewardOption | null {
    const reward = createRewardFromSpecs(specs, exclusions);
    if (!reward) {
      return null;
    }
    exclusions.add(reward.matchKey);
    return new RewardOption(reward, upgradeCount, tier);
  }

  // #endregion Generation
}

/** The pool the player draws from during reward selection. Populated by `initRewardPools`. */
export const playerRewardPool = new RewardPool();
