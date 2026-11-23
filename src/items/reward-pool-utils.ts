import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import type { PokeballType } from "#enums/pokeball";
import { isHeldItemId, isTrainerItemId } from "#enums/reward-id";
import { RewardPoolType } from "#enums/reward-pool-type";
import { RarityTier } from "#enums/reward-tier";
import { allRewards } from "#items/all-rewards";
import { Reward, RewardGenerator, RewardOption } from "#items/reward";
import { POOL_RARITY_TIERS, rewardPool, rewardPoolWeights } from "#items/reward-pools";
import { createRewardFromSpecs, generateRewardOptionFromId } from "#items/reward-utils";
import type {
  PoolRarityTier,
  RewardConfiguration,
  RewardPool,
  RewardPoolEntry,
  RewardPoolId,
  RewardPoolWeights,
  RewardWeightFunc,
} from "#types/rewards";
import { randSeedInt } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import { weightedPick } from "#utils/random";
import { isHeldItemRewardAvailable } from "./rewards/held-item-reward";

/*
This file contains functions to generate rewards from pools.

At the top of the food chain is `generatePlayerRewardOptions`, which is responsible for creating item rewards for the player.
It can take a `CustomRewardSettings` to fix any number of rewards or tiers, then fills the remaining spots randomly.
Note that this function generates `RewardOption` instances, not yet `Reward`s.
Currently, there is only one reward pool, but in the future we will want to allow for custom pools.

The function `getNewRewardOption` is responsible for generating a single RewardOption from a given pool and set of weights.
*/

export interface CustomRewardSettings {
  guaranteedRarityTiers?: PoolRarityTier[];
  guaranteedRewardOptions?: RewardOption[];
  /** If specified, will override the next X items to be auto-generated from specific reward functions (these don't have to be pre-genned). */
  guaranteedRewardSpecs?: RewardConfiguration[];
  /**
   * If set to `true`, will fill the remainder of shop items that were not overridden by the 3 options above, up to the `count` param value.
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
  /** If specified, can adjust the amount of money required for a shop reroll. If set to a negative value, the shop will not allow rerolls at all. */
  rerollMultiplier?: number;
  /**
   * If `false`, will prevent set item tiers from upgrading via luck.
   * @defaultValue `true`
   */
  allowLuckUpgrades?: boolean;
}

/**
 * @param weight - The entry's static or dynamic weight
 * @param rerollCount - The number of rerolls performed so far
 * @returns The numeric weight for the reward
 */
function resolveWeight(weight: number | RewardWeightFunc, rerollCount: number): number {
  return typeof weight === "number" ? weight : weight(rerollCount);
}

/**
 * Generates weights for a {@linkcode RewardPool}.
 * An array of weights is generated for each rarity tier. Unavailable entries are weighted `0`.
 * @param pool - The pool for which weights must be generated
 * @param rerollCount - (Default `0`) Needed for weights of vouchers.
 */
export function generateRewardPoolWeights(pool: RewardPool, rerollCount = 0): void {
  for (const tier of POOL_RARITY_TIERS) {
    rewardPoolWeights[tier] = pool[tier].map(entry =>
      isPoolEntryAvailable(entry.id) ? resolveWeight(entry.weight, rerollCount) : 0,
    );
  }
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
  return !exclusions?.has(Reward.getMatchKey(id));
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
 * Check whether a tier exists in the pool and has at least one entry with positive weight.
 * @param weights - The resolved pool weights
 * @param tier - The tier to check
 */
function hasRollableEntries(weights: RewardPoolWeights, tier: number): boolean {
  return POOL_RARITY_TIERS.includes(tier) && weights[tier]?.some(w => w > 0);
}

/**
 * Determines the number of tier upgrades for a given rarity tier, based on the party luck.
 * Will not upgrade into a tier that has no rollable entries.
 * @param weights - The resolved weights of the pool being rolled from
 * @param baseTier - The initial tier to upgrade
 * @returns The number of tiers to upgrade by
 */
function getRarityUpgradeCount(weights: RewardPoolWeights, baseTier: PoolRarityTier): number {
  const upgradeOdds = Math.floor(128 / ((getPartyLuckValue() + 4) / 4));
  let upgradeCount = 0;
  while (hasRollableEntries(weights, baseTier + upgradeCount + 1) && randSeedInt(upgradeOdds) < 4) {
    upgradeCount++;
  }
  return upgradeCount;
}

/**
 * Filter pool entries for a given tier against exclusions and non-positive weights.
 * @param pool - The reward pool
 * @param weights - The reward weights
 * @param exclusions - Match keys to exclude
 * @param tier - Rarity tier to filter
 * @returns Map of valid pool entries to their weights
 */
function getRewardMapForTier(
  pool: RewardPool,
  weights: RewardPoolWeights,
  exclusions: ReadonlySet<string>,
  tier: PoolRarityTier,
): Map<RewardPoolEntry, number> {
  const map = new Map<RewardPoolEntry, number>();
  for (const [index, entry] of pool[tier].entries()) {
    const weight = weights[tier][index];
    if (weight <= 0 || !isPoolEntryAvailable(entry.id, exclusions)) {
      continue;
    }
    map.set(entry, weight);
  }
  return map;
}

/**
 * Generates reward options for a {@linkcode SelectRewardPhase}
 * @param count - Determines the number of items to generate
 * @param rarityTiers - (Optional) If specified, rolls items in the specified tiers. Commonly used for tier-locking with Lock Capsule.
 * @param customRewardSettings - (Optional) See {@linkcode CustomRewardSettings}
 */
export function generatePlayerRewardOptions(
  count: number,
  rarityTiers?: PoolRarityTier[],
  customRewardSettings?: CustomRewardSettings,
): RewardOption[] {
  const options: RewardOption[] = [];
  const pool = getRewardPoolForType(RewardPoolType.PLAYER);
  const weights = getRewardWeightsForType(RewardPoolType.PLAYER);
  const exclusions = new Set<string>();

  if (customRewardSettings?.guaranteedRewardOptions) {
    for (const option of customRewardSettings.guaranteedRewardOptions) {
      options.push(option);
      exclusions.add(option.type.matchKey);
    }
  }

  if (customRewardSettings?.guaranteedRewardSpecs) {
    for (const specs of customRewardSettings.guaranteedRewardSpecs) {
      const rewardOption = generateRewardOptionFromId(specs);
      if (rewardOption) {
        options.push(rewardOption);
        exclusions.add(rewardOption.type.matchKey);
      }
    }
  }

  if (customRewardSettings) {
    if (customRewardSettings.guaranteedRarityTiers) {
      const allowLuckUpgrades = customRewardSettings.allowLuckUpgrades ?? true;
      for (const tier of customRewardSettings.guaranteedRarityTiers) {
        const option = getNewRewardOption(pool, weights, exclusions, tier, allowLuckUpgrades);
        if (option) {
          options.push(option);
        }
      }
    }

    if (options.length < count && customRewardSettings.fillRemaining) {
      while (options.length < count) {
        const option = getNewRewardOption(pool, weights, exclusions);
        if (!option) {
          break;
        }
        options.push(option);
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      const option = getNewRewardOption(pool, weights, exclusions, rarityTiers?.[i]);
      if (!option) {
        break;
      }
      options.push(option);
    }
  }

  overridePlayerRewardOptions(options);

  return options;
}

/**
 * Create a {@linkcode RewardOption} for a selected pool entry.
 * @param id - Pool entry ID
 * @param tier - Current rarity tier
 * @param upgradeCount - Tier upgrades having occurred
 * @param exclusions - Match keys to exclude when a generator picks its variant
 * @returns The generated reward option, or `null` if the entry could not produce a reward
 */
function createOptionFromPoolEntry(
  id: RewardPoolId,
  tier: PoolRarityTier,
  upgradeCount: number,
  exclusions: ReadonlySet<string>,
): RewardOption | null {
  const reward = createRewardFromSpecs(id, exclusions);
  return reward ? new RewardOption(reward, upgradeCount, tier) : null;
}

/**
 * Pick a reward option from a specific rarity tier.
 * @param pool - The reward pool
 * @param weights - The reward weights
 * @param exclusions - Match keys to exclude
 * @param tier - Rarity tier to roll from
 * @param upgradeCount - Tier upgrades having occurred
 * @returns Generated reward option, or null if the tier has no valid entries
 */
function tryPickOptionFromTier(
  pool: RewardPool,
  weights: RewardPoolWeights,
  exclusions: Set<string>,
  tier: PoolRarityTier,
  upgradeCount: number,
): RewardOption | null {
  const rewardMap = getRewardMapForTier(pool, weights, exclusions, tier);
  if (rewardMap.size === 0) {
    return null;
  }

  const pickedEntry = weightedPick(rewardMap);
  const option = createOptionFromPoolEntry(pickedEntry.id, tier, upgradeCount, exclusions);
  if (option) {
    exclusions.add(option.type.matchKey);
  }
  return option;
}

/**
 * Retry order for tiers without valid entries - steps down to common, then up from the initial tier to master.
 * @param initialTier - The tier to start from
 */
function getTierSearchOrder(initialTier: PoolRarityTier): PoolRarityTier[] {
  const index = POOL_RARITY_TIERS.indexOf(initialTier);
  return [...POOL_RARITY_TIERS.slice(0, index + 1).reverse(), ...POOL_RARITY_TIERS.slice(index + 1)];
}

/**
 * Generate a reward option from the pool, excluding already-selected items.
 * @param pool - Reward pool by rarity tier
 * @param weights - Precalculated weights by rarity tier
 * @param exclusions - Match keys to exclude from rolling
 * @param baseTier - Initial tier (randomly rolled if omitted)
 * @param allowLuckUpgrades - Whether the item can upgrade tiers via luck
 * @returns The generated reward option, or null if no valid entries remain
 */
function getNewRewardOption(
  pool: RewardPool,
  weights: RewardPoolWeights,
  exclusions: Set<string>,
  baseTier: PoolRarityTier = randomBaseTier(),
  allowLuckUpgrades = true,
): RewardOption | null {
  const upgradeCount = allowLuckUpgrades ? getRarityUpgradeCount(weights, baseTier) : 0;
  // valid cast as `getRarityUpgradeCount` only ever upgrades into existing pool tiers
  const initialTier = (baseTier + upgradeCount) as PoolRarityTier;

  for (const tier of getTierSearchOrder(initialTier)) {
    const option = tryPickOptionFromTier(pool, weights, exclusions, tier, tier === initialTier ? upgradeCount : 0);
    if (option) {
      return option;
    }
  }

  return null;
}

/**
 * Replaces the {@linkcode Reward} of the entries within {@linkcode options} with any
 * up to the smallest amount of entries between {@linkcode options} and the override array.
 * @param options Array of naturally rolled {@linkcode RewardOption}s
 */
export function overridePlayerRewardOptions(options: RewardOption[]): void {
  const minLength = Math.min(options.length, activeOverrides.REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const specs: RewardConfiguration = activeOverrides.REWARD_OVERRIDE[i];
    const rewardOption = generateRewardOptionFromId(specs);
    if (rewardOption) {
      options[i] = rewardOption;
    }
  }
}

export function getRewardPoolForType(poolType: RewardPoolType): RewardPool {
  switch (poolType) {
    case RewardPoolType.PLAYER:
      return rewardPool;
  }
}

export function getRewardWeightsForType(poolType: RewardPoolType): RewardPoolWeights {
  switch (poolType) {
    case RewardPoolType.PLAYER:
      return rewardPoolWeights;
  }
}

/**
 * Finds how many party members have a non-volatile status condition in need of healing
 * @param max - The maximum amount of statused party members to consider
 * @returns The number of statused party members
 */
export function getStatusedPartyMemberCount(max = 1): number {
  return Math.min(globalScene.getPlayerParty().filter(p => p.hp && !!p.status && !p.hasStatusFromOrb()).length, max);
}

/**
 * Used to check if the player has max of a given ball type in Classic
 * @param ballType - The {@linkcode PokeballType} being checked
 * @returns Whether the player has the maximum of a given ball type
 */
export function hasMaximumBalls(ballType: PokeballType): boolean {
  return globalScene.gameMode.isClassic && globalScene.pokeballCounts[ballType] >= MAX_PER_TYPE_POKEBALLS;
}
