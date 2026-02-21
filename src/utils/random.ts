/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * A collection of utility methods for working with the game's RNG
 * @module
 */

import { globalScene } from "#app/global-scene";
import type { Mutable } from "#types/type-helpers";
import { randSeedInt, randSeedItem, randSeedShuffle } from "#utils/common";

/**
 * Select a random element using an offset such that the chosen element is
 * guaranteed to be unique from the last `seedOffset` selections.
 *
 * @remarks
 * If the seed offset is greater than the number of choices, this will just choose a random element
 *
 * @param choices - The array of items to choose from
 * @param seedOffset - The offset into the shuffled array
 * @param scene - (default {@linkcode globalScene}); The scene to use for random seeding
 * @returns A random item from the array that is guaranteed to be different from the previous result
 * @typeParam T - The type of items in the array
 *
 * @example
 * ```
 * const choices = ['a', 'b', 'c', 'd'];
 * const choice1 = randSeedUniqueItem(choices, 0);
 * const choice2 = randSeedUniqueItem(choices, 1);
 * const choice3 = randSeedUniqueItem(choices, 2);
 * assert(choice2 !== choice1);
 * assert(choice3 !== choice1);
 * assert(choice3 !== choice2);
 * ```
 */
export function randSeedUniqueItem<T>(choices: readonly T[], seedOffset: number, scene = globalScene): T {
  if (choices.length <= seedOffset) {
    return randSeedItem(choices as Mutable<typeof choices>);
  }

  // TODO: Refactor `excuteWithSeedOffset` and pull it into this module
  let choice: T;

  scene.executeWithSeedOffset(() => {
    choice = randSeedShuffle(choices.slice())[seedOffset];
  }, 0);
  return choice!;
}

/**
 * Function for picking an item out of a mapping based on the given weights
 * @param items - The mapping of item to weight
 * @returns a randomly picked item according to the weights
 */
export function weightedPick<T>(items: Map<T, number>): T {
  const totalWeight = [...items.values()].reduce((a: number, b: number) => a + b, 0);
  const randomNumber = randSeedInt(totalWeight);

  let totalWeightSoFar = 0;
  for (const [i, weight] of items) {
    totalWeightSoFar += weight;

    // This is a < and not a <= since the first item can have 0 weight
    if (randomNumber < totalWeightSoFar) {
      return i;
    }
  }

  // Failsafe if the above loop somehow failed (e.g., if all items have 0 weight)
  console.error("Random selection failed, selecting the first element instead. Original list of items:", items);
  return items.keys()[0];
}
