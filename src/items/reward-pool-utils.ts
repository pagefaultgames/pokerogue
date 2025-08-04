import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { RewardPoolType } from "#enums/reward-pool-type";
import { RarityTier } from "#enums/reward-tier";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { RewardPool, RewardPoolWeights, RewardSpecs } from "#types/rewards";
import { isNullOrUndefined, pickWeightedIndex, randSeedInt } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import type { RewardOption } from "./reward";
import { rewardPool, rewardPoolWeights } from "./reward-pools";
import { generateRewardOptionFromId, isTrainerItemId } from "./reward-utils";

/*
This file still contains several functions to generate rewards from pools. The hierarchy of these functions is explained here.

At the top of the food chain is `generatePlayerRewardOptions`, which is responsible for creating item rewards for the player.
It can take a `CustomRewardSettings` to fix any number of rewards or tiers, then fills the remaining spots randomly.
Note that this function generates `RewardOption` instances, not yet `Reward`s.
Currently, there is only one reward pool, but in the future we will want to allow for custom pools.

The function `getNewRewardOption` is responsible for generating a single RewardOption from a given pool and set of weights.
Note that, in the previous system, this function could in principle generate rewards for enemies, which was used in some
cases to assign modifiers. This usage is now deprecated, as we have separate pools for held items and trainer items for enemies.

However, `getNewRewardOption` is not called directly by `generatePlayerRewardOptions`. Instead, it is filtered
by `getRewardOptionWithRetry`, which also checks existing rewards to minimize the chance of duplicates.

This will allow more customization in creating pools for challenges, MEs etc.
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
 * Generates weights for a {@linkcode RewardPool}. An array of weights is generated for each rarity tier. Weights can be 0.
 * @param pool - The pool for which weights must be generated
 * @param party - Party is required for generating the weights
 * @param rerollCount - (Optional) Needed for weights of vouchers.
 */
export function generateRewardPoolWeights(pool: RewardPool, party: Pokemon[], rerollCount = 0) {
  for (const tier of Object.keys(pool)) {
    const poolWeights = pool[tier].map(w => {
      if (isTrainerItemId(w.id)) {
        if (globalScene.trainerItems.isMaxStack(w.id)) {
          return 0;
        }
      }
      if (typeof w.weight === "number") {
        return w.weight;
      }
      return w.weight(party, rerollCount);
    });
    rewardPoolWeights[tier] = poolWeights;
  }
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
function getRarityUpgradeCount(pool: RewardPool, baseTier: RarityTier, party: Pokemon[]): RarityTier {
  let upgradeCount = 0;
  if (baseTier < RarityTier.MASTER) {
    const partyLuckValue = getPartyLuckValue(party);
    const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
    while (pool.hasOwnProperty(baseTier + upgradeCount + 1) && pool[baseTier + upgradeCount + 1].length) {
      if (randSeedInt(upgradeOdds) < 4) {
        upgradeCount++;
      } else {
        break;
      }
    }
  }
  return upgradeCount;
}

/**
 * Generates reward options for a {@linkcode SelectRewardPhase}
 * @param count - Determines the number of items to generate
 * @param party - Party is required for generating proper reward pools
 * @param rarityTiers - (Optional) If specified, rolls items in the specified tiers. Commonly used for tier-locking with Lock Capsule.
 * @param customRewardSettings - (Optional) See {@linkcode CustomRewardSettings}
 */
export function generatePlayerRewardOptions(
  count: number,
  party: PlayerPokemon[],
  rarityTiers?: RarityTier[],
  customRewardSettings?: CustomRewardSettings,
): RewardOption[] {
  const options: RewardOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  // TODO: Change this to allow for custom reward pools
  const pool = getRewardPoolForType(RewardPoolType.PLAYER);
  const weights = getRewardWeightsForType(RewardPoolType.PLAYER);
  if (!customRewardSettings) {
    for (let i = 0; i < count; i++) {
      const tier = rarityTiers && rarityTiers.length > i ? rarityTiers[i] : undefined;
      options.push(getRewardOptionWithRetry(pool, weights, options, retryCount, party, tier));
    }
  } else {
    // Guaranteed reward options first
    if (customRewardSettings?.guaranteedRewardOptions && customRewardSettings.guaranteedRewardOptions.length > 0) {
      options.push(...customRewardSettings.guaranteedRewardOptions!);
    }

    if (customRewardSettings?.guaranteedRewardSpecs && customRewardSettings.guaranteedRewardSpecs.length > 0) {
      for (const specs of customRewardSettings.guaranteedRewardSpecs) {
        const rewardOption = generateRewardOptionFromId(specs);
        if (rewardOption) {
          options.push(rewardOption);
        }
      }
    }

    // Guaranteed tiers third
    if (customRewardSettings.guaranteedRarityTiers && customRewardSettings.guaranteedRarityTiers.length > 0) {
      const allowLuckUpgrades = customRewardSettings.allowLuckUpgrades ?? true;
      for (const tier of customRewardSettings.guaranteedRarityTiers) {
        options.push(getRewardOptionWithRetry(pool, weights, options, retryCount, party, tier, allowLuckUpgrades));
      }
    }

    // Fill remaining
    if (options.length < count && customRewardSettings.fillRemaining) {
      while (options.length < count) {
        options.push(getRewardOptionWithRetry(pool, weights, options, retryCount, party, undefined));
      }
    }
  }

  // Applies overrides for testing
  overridePlayerRewardOptions(options, party);

  return options;
}

/**
 * Will generate a {@linkcode RewardOption} from the {@linkcode RewardPoolType.PLAYER} pool, attempting to retry duplicated items up to retryCount
 * @param pool - {@linkcode RewardPool} to generate items from
 * @param weights - {@linkcode RewardPoolWeights} to use when generating items
 * @param existingOptions Currently generated options
 * @param retryCount How many times to retry before allowing a dupe item
 * @param party Current player party, used to calculate items in the pool
 * @param tier If specified will generate item of tier
 * @param allowLuckUpgrades `true` to allow items to upgrade tiers (the little animation that plays and is affected by luck)
 */
function getRewardOptionWithRetry(
  pool: RewardPool,
  weights: RewardPoolWeights,
  existingOptions: RewardOption[],
  retryCount: number,
  party: PlayerPokemon[],
  tier?: RarityTier,
  allowLuckUpgrades?: boolean,
): RewardOption {
  allowLuckUpgrades = allowLuckUpgrades ?? true;
  let candidate = getNewRewardOption(pool, weights, party, tier, undefined, 0, allowLuckUpgrades);
  let r = 0;
  while (
    existingOptions.length &&
    ++r < retryCount &&
    //TODO: Improve this condition to refine what counts as a dupe
    existingOptions.filter(o => o.type.name === candidate?.type.name || o.type.group === candidate?.type.group).length
  ) {
    console.log("Retry count:", r);
    console.log(candidate?.type.group);
    console.log(candidate?.type.name);
    console.log(existingOptions.filter(o => o.type.name === candidate?.type.name).length);
    console.log(existingOptions.filter(o => o.type.group === candidate?.type.group).length);
    candidate = getNewRewardOption(
      pool,
      weights,
      party,
      candidate?.type.tier ?? tier,
      candidate?.upgradeCount,
      0,
      allowLuckUpgrades,
    );
  }
  return candidate!;
}

/**
 * Generates a Reward from the specified pool
 * @param pool - {@linkcode RewardPool} to generate items from
 * @param weights - {@linkcode RewardPoolWeights} to use when generating items
 * @param party - party of the trainer using the item
 * @param baseTier - If specified, will override the initial tier of an item (can still upgrade with luck)
 * @param upgradeCount - If defined, means that this is a new Reward being generated to override another via luck upgrade. Used for recursive logic
 * @param retryCount - Max allowed tries before the next tier down is checked for a valid Reward
 * @param allowLuckUpgrades - Default true. If false, will not allow Reward to randomly upgrade to next tier
 */
function getNewRewardOption(
  pool: RewardPool,
  weights: RewardPoolWeights,
  party: PlayerPokemon[],
  baseTier?: RarityTier,
  upgradeCount?: number,
  retryCount = 0,
  allowLuckUpgrades = true,
): RewardOption | null {
  let tier = 0;
  if (isNullOrUndefined(baseTier)) {
    baseTier = randomBaseTier();
  }
  if (isNullOrUndefined(upgradeCount)) {
    upgradeCount = allowLuckUpgrades ? getRarityUpgradeCount(pool, baseTier, party) : 0;
    tier = baseTier + upgradeCount;
  } else {
    tier = baseTier;
  }

  const tierWeights = weights[tier];
  const index = pickWeightedIndex(tierWeights);

  if (index === undefined) {
    return null;
  }

  const rewardOption = generateRewardOptionFromId(pool[tier][index].id, 0, tier, upgradeCount);
  if (rewardOption === null) {
    console.log(RarityTier[tier], upgradeCount);
    return getNewRewardOption(pool, weights, party, tier, upgradeCount, ++retryCount);
  }

  console.log(rewardOption);

  return rewardOption;
}

/**
 * Replaces the {@linkcode Reward} of the entries within {@linkcode options} with any
 * up to the smallest amount of entries between {@linkcode options} and the override array.
 * @param options Array of naturally rolled {@linkcode RewardOption}s
 */
export function overridePlayerRewardOptions(options: RewardOption[]) {
  const minLength = Math.min(options.length, Overrides.REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const specs: RewardSpecs = Overrides.REWARD_OVERRIDE[i];
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
