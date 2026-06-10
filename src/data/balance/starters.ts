import { IS_TEST } from "#constants/app-constants";
import type { IntClosedRange } from "type-fest";

export const POKERUS_STARTER_COUNT = 5;

// #region Friendship constants

/** The multiplier applied to candy friendship gain in classic mode. */
export const CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER = 3;
/** The base amount of friendship gained from a single battle. */
export const FRIENDSHIP_GAIN_FROM_BATTLE = 3;
/** The base amount of friendship gained from using a Rare Candy. */
export const FRIENDSHIP_GAIN_FROM_RARE_CANDY = 6;
/** The amount of friendship lost upon fainting. */
export const FRIENDSHIP_LOSS_FROM_FAINT = 5;
/** The minimum friendship value for enemy trainers at wave 1. */
export const TRAINER_MIN_FRIENDSHIP = 50;
/** The wave at which enemy trainers reach the maximum friendship value of 255. */
export const TRAINER_MAX_FRIENDSHIP_WAVE = 145;

// #endregion Friendship constants

/** The numeric point cost of a starter. */
export type StarterCost = IntClosedRange<1, 10>;

/**
 * Function to get the cumulative friendship threshold at which a candy is earned
 * @param starterCost - The cost of the starter
 * @returns aforementioned threshold
 */
// TODO: maybe move to the species registry class
export function getStarterValueFriendshipCap(starterCost: StarterCost): number {
  switch (starterCost) {
    case 1:
      return 25;
    case 2:
      return 50;
    case 3:
      return 75;
    case 4:
      return 100;
    case 5:
      return 150;
    case 6:
      return 200;
    case 7:
      return 300;
    case 8:
    case 9:
      return 450;
    case 10:
    default: // fallback for invalid starter costs (should never happen, but just in case)
      return 600;
  }
}

interface StarterCandyCosts {
  /** The candy cost to unlock the starter's passive ability */
  readonly passive: number;
  /** The candy costs to reduce the starter's point cost */
  readonly costReduction: readonly [number, number];
  /** The costs to buy a same-species egg */
  readonly eggCosts: readonly [number, ...number[]];
  /** The number of eggs required to hatch to reduce the cost for buying more eggs */
  readonly eggCostReductionThresholds: readonly number[];
}

const allStarterCandyCosts: readonly StarterCandyCosts[] = [
  { passive: 40, costReduction: [25, 60], eggCosts: [30, 27, 22, 15], eggCostReductionThresholds: [20, 40, 80] }, // 1 Cost
  { passive: 40, costReduction: [25, 60], eggCosts: [30, 27, 22, 15], eggCostReductionThresholds: [20, 40, 80] }, // 2 Cost
  { passive: 35, costReduction: [20, 50], eggCosts: [25, 22, 18, 12], eggCostReductionThresholds: [20, 40, 80] }, // 3 Cost
  { passive: 30, costReduction: [15, 40], eggCosts: [20, 18, 15, 10], eggCostReductionThresholds: [15, 30, 60] }, // 4 Cost
  { passive: 25, costReduction: [12, 35], eggCosts: [18, 16, 13, 9], eggCostReductionThresholds: [15, 30, 60] }, // 5 Cost
  { passive: 20, costReduction: [10, 30], eggCosts: [15, 13, 11, 7], eggCostReductionThresholds: [15, 30, 60] }, // 6 Cost
  { passive: 15, costReduction: [8, 20], eggCosts: [12, 10, 9, 6], eggCostReductionThresholds: [10, 20, 40] }, // 7 Cost
  { passive: 10, costReduction: [5, 15], eggCosts: [10, 9, 7, 5], eggCostReductionThresholds: [10, 20, 40] }, // 8 Cost
  { passive: 10, costReduction: [5, 15], eggCosts: [10, 9, 7, 5], eggCostReductionThresholds: [10, 20, 40] }, // 9 Cost
  { passive: 10, costReduction: [5, 15], eggCosts: [10, 9, 7, 5], eggCostReductionThresholds: [8, 16, 32] }, // 10 Cost
];

/**
 * Getter for {@linkcode allStarterCandyCosts} for passive unlock candy cost based on initial point cost
 * @param starterCost - The default point cost of the starter
 * @returns the candy cost for passive unlock
 */
export function getPassiveCandyCount(starterCost: number): number {
  return allStarterCandyCosts[starterCost - 1].passive;
}

/**
 * Getter for {@linkcode allStarterCandyCosts} for value reduction unlock candy cost based on initial point cost
 * @param starterCost - The default point cost of the starter
 * @returns respective candy cost for the two cost reductions as an array 2 numbers
 */
export function getValueReductionCandyCounts(starterCost: number): readonly [number, number] {
  return allStarterCandyCosts[starterCost - 1].costReduction;
}

/**
 * Getter for {@linkcode allStarterCandyCosts} for egg purchase candy cost based on initial point cost
 * @param starterCost - The default point cost of the starter
 * @param hatchCount - The number of eggs hatched of the starter
 * @returns the candy cost for the purchasable egg
 */
export function getSameSpeciesEggCandyCounts(starterCost: number, hatchCount: number): number {
  const starterCandyCosts = allStarterCandyCosts[starterCost - 1];
  let eggCostIndex = 0;
  while (hatchCount >= starterCandyCosts.eggCostReductionThresholds[eggCostIndex]) {
    eggCostIndex++;
  }
  return starterCandyCosts.eggCosts[eggCostIndex];
}

/**
 * ⚠️ This is used for internal testing purposes only and will not be populated outside of the test environment.
 * @internal
 */
export const __TEST_allStarterCandyCosts: readonly StarterCandyCosts[] = [];

if (IS_TEST) {
  for (const starterCandyCosts of allStarterCandyCosts) {
    // @ts-expect-error: done this way to keep it `readonly`
    __TEST_allStarterCandyCosts.push(starterCandyCosts);
  }
}
