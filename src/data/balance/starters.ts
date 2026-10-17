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
  readonly eggCost: number;
}

const allStarterCandyCosts: readonly StarterCandyCosts[] = [
  { passive: 40, costReduction: [25, 60], eggCost: 20 }, // 1 Cost
  { passive: 40, costReduction: [25, 60], eggCost: 20 }, // 2 Cost
  { passive: 35, costReduction: [20, 50], eggCost: 15 }, // 3 Cost
  { passive: 30, costReduction: [15, 40], eggCost: 12 }, // 4 Cost
  { passive: 25, costReduction: [12, 35], eggCost: 10 }, // 5 Cost
  { passive: 20, costReduction: [10, 30], eggCost: 8 }, // 6 Cost
  { passive: 15, costReduction: [8, 20], eggCost: 7 }, // 7 Cost
  { passive: 10, costReduction: [5, 15], eggCost: 6 }, // 8 Cost
  { passive: 10, costReduction: [5, 15], eggCost: 6 }, // 9 Cost
  { passive: 10, costReduction: [5, 15], eggCost: 5 }, // 10 Cost
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
 * @returns the candy cost for the purchasable egg
 */
export function getSameSpeciesEggCandyCounts(starterCost: number): number {
  return allStarterCandyCosts[starterCost - 1].eggCost;
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
