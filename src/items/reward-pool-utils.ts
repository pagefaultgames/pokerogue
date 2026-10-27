import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import type { PokeballType } from "#enums/pokeball";
import { RewardPoolType } from "#enums/reward-pool-type";
import { RarityTier } from "#enums/reward-tier";
import { allRewards } from "#items/all-rewards";
import type { RewardPool, RewardPoolEntry, RewardPoolId, RewardPoolWeights, RewardSpecs } from "#types/rewards";
import { randSeedInt, randSeedItem } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import { weightedPick } from "#utils/random";
import { EmptyReward, Reward, RewardGenerator, RewardOption } from "./reward";
import { rewardPool, rewardPoolWeights } from "./reward-pools";
import { generateRewardOptionFromId, isHeldItemId, isRewardId, isTrainerItemId } from "./reward-utils";
import { HeldItemReward } from "./rewards/held-item-reward";
import { TrainerItemReward } from "./rewards/trainer-item-reward";

/*
This file contains functions to generate rewards from pools.

At the top of the food chain is `generatePlayerRewardOptions`, which is responsible for creating item rewards for the player.
It can take a `CustomRewardSettings` to fix any number of rewards or tiers, then fills the remaining spots randomly.
Note that this function generates `RewardOption` instances, not yet `Reward`s.
Currently, there is only one reward pool, but in the future we will want to allow for custom pools.

The function `getNewRewardOption` is responsible for generating a single RewardOption from a given pool and set of weights.
*/

export interface CustomRewardSettings {
  guaranteedRarityTiers?: RarityTier[];
  guaranteedRewardOptions?: RewardOption[];
  /** If specified, will override the next X items to be auto-generated from specific reward functions (these don't have to be pre-genned). */
  guaranteedRewardSpecs?: RewardSpecs[];
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
 * Generates weights for a {@linkcode RewardPool}.
 * An array of weights is generated for each rarity tier.
 * Weights can be 0.
 * @param pool - The pool for which weights must be generated
 * @param rerollCount - (Default `0`) Needed for weights of vouchers.
 */
export function generateRewardPoolWeights(pool: RewardPool, rerollCount = 0) {
  for (const tier of Object.keys(pool)) {
    const poolWeights = pool[tier].map(w => {
      if (isTrainerItemId(w.id) && globalScene.trainerItems.isMaxStack(w.id)) {
        return 0;
      }
      if (!isPoolEntryAvailable(w.id)) {
        return 0;
      }
      if (typeof w.weight === "number") {
        return w.weight;
      }
      return w.weight(rerollCount);
    });
    rewardPoolWeights[tier] = poolWeights;
  }
}

/**
 * Check if a reward pool entry is available for selection given active exclusions.
 * @param id - Pool entry ID
 * @param exclusions - Optional set of match keys to exclude
 * @returns True if available, false if excluded or exhausted
 */
function isPoolEntryAvailable(id: RewardPoolId, exclusions?: ReadonlySet<string>): boolean {
  if (isRewardId(id)) {
    const rewardOrGen = allRewards[id];
    if (rewardOrGen instanceof RewardGenerator) {
      return rewardOrGen.getCapacity(exclusions) > 0;
    }
    return !exclusions?.has(Reward.getMatchKey(id));
  }
  if (isHeldItemId(id)) {
    return !exclusions?.has(HeldItemReward.getItemMatchKey(id));
  }
  if (isTrainerItemId(id)) {
    return !exclusions?.has(TrainerItemReward.getItemMatchKey(id));
  }
  return false;
}

/**
 * Generates a random RarityTier to draw rewards from the pool. The probabilities are:
 * 1/1024 (Master tier)
 * 12/1024 (Rogue tier)
 * 48/1024 (Ultra tier)
 * 195/1024 (Great tier)
 * 768/1024 (Common tier)
 * return {@linkcode RarityTier}
 */
function randomBaseTier(): RarityTier {
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
 * Determines the upgrade count for a given rarity tier, based on the party luck. Will not update
 * if the pool would have no entries at the new rarity.
 * @param pool - RewardPool from which the reward will be generated
 * @param baseTier - The initial tier to upgrade
 * @param party - Party of the trainer using the item
 * return {@linkcode RarityTier}
 */
function getRarityUpgradeCount(pool: RewardPool, baseTier: RarityTier): RarityTier {
  if (baseTier === RarityTier.MASTER) {
    return 0;
  }

  let upgradeCount = 0;
  const partyLuckValue = getPartyLuckValue();
  const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
  while (
    Object.hasOwn(pool, baseTier + upgradeCount + 1)
    && pool[baseTier + upgradeCount + 1].length > 0
    && (rewardPoolWeights[baseTier + upgradeCount + 1]?.some(w => w > 0) ?? true)
  ) {
    if (randSeedInt(upgradeOdds) < 4) {
      upgradeCount++;
    } else {
      break;
    }
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
  tier: RarityTier,
): Map<RewardPoolEntry, number> {
  const map = new Map<RewardPoolEntry, number>();
  for (const [index, entry] of pool[tier].entries()) {
    const weight = weights[tier][index];
    if (weight <= 0) {
      continue;
    }
    if (!isPoolEntryAvailable(entry.id, exclusions)) {
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
  rarityTiers?: RarityTier[],
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
      const tier = rarityTiers && rarityTiers.length > i ? rarityTiers[i] : undefined;
      const option = getNewRewardOption(pool, weights, exclusions, tier);
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
 * @param exclusions - Match keys to exclude for generator variants
 * @returns Generated reward option
 */
function createOptionFromPoolEntry(
  id: RewardPoolId,
  tier: RarityTier,
  upgradeCount: number,
  exclusions: ReadonlySet<string>,
): RewardOption {
  if (isRewardId(id)) {
    const rewardOrGenerator = allRewards[id];
    if (rewardOrGenerator instanceof RewardGenerator) {
      const generator: RewardGenerator = rewardOrGenerator;
      const variants = generator.getAvailableItems(exclusions);
      const pickedVariant = randSeedItem(variants);
      const reward = generator.generateReward(pickedVariant) ?? new EmptyReward();
      return new RewardOption(reward, upgradeCount, tier, 0);
    }
  }

  return generateRewardOptionFromId(id, 0, tier, upgradeCount);
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
  tier: RarityTier,
  upgradeCount: number,
): RewardOption | null {
  const rewardMap = getRewardMapForTier(pool, weights, exclusions, tier);
  if (rewardMap.size === 0) {
    return null;
  }

  const pickedEntry = weightedPick(rewardMap);
  const option = createOptionFromPoolEntry(pickedEntry.id, tier, upgradeCount, exclusions);
  exclusions.add(option.type.matchKey);
  return option;
}

/**
 * Generate a reward option from the pool, excluding already-selected items.
 * @param pool - Reward pool by rarity tier
 * @param weights - Precalculated weights by rarity tier
 * @param exclusions - Match keys to exclude from rolling
 * @param baseTier - Initial tier override
 * @param allowLuckUpgrades - Whether the item can upgrade tiers via luck
 * @returns The generated reward option, or null if no valid entries remain
 */
function getNewRewardOption(
  pool: RewardPool,
  weights: RewardPoolWeights,
  exclusions: Set<string>,
  baseTier?: RarityTier,
  allowLuckUpgrades = true,
): RewardOption | null {
  if (baseTier == null) {
    baseTier = randomBaseTier();
  }
  const upgradeCount = allowLuckUpgrades ? getRarityUpgradeCount(rewardPool, baseTier) : 0;
  const initialTier = baseTier + upgradeCount;

  const tiers: RarityTier[] = [];
  for (let tier = initialTier; tier >= RarityTier.COMMON; tier--) {
    tiers.push(tier);
  }
  for (let tier = initialTier + 1; tier <= RarityTier.MASTER; tier++) {
    tiers.push(tier);
  }

  for (const tier of tiers) {
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
export function overridePlayerRewardOptions(options: RewardOption[]) {
  const minLength = Math.min(options.length, activeOverrides.REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const specs: RewardSpecs = activeOverrides.REWARD_OVERRIDE[i];
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
