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
import { randSeedItem } from "#utils/common";

/**
 * Select a random element using an offset such that the chosen element is
 * guaranteed to be unique from the last `seedOffset` selections.
 *
 * @remarks
 * If the seed offset is greater than the number of choices, this will just choose a random element
 *
 * @param arr - The array of items to choose from
 * @param scene - (default {@linkcode globalScene}); The scene to use for random seeding
 * @returns A random item from the array that is guaranteed to be different from the
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
  if (seedOffset === 0 || choices.length <= seedOffset) {
    // cast to mutable is safe because randSeedItem does not actually modify the array
    return randSeedItem(choices as Mutable<typeof choices>);
  }

  // TODO: Refactor `excuteWithSeedOffset` and pull it into this module
  let choice: T;

  scene.executeWithSeedOffset(() => {
    const curChoices = choices.slice();
    for (let i = 0; i < seedOffset; i++) {
      const previousChoice = randSeedItem(curChoices);
      curChoices.splice(curChoices.indexOf(previousChoice), 1);
    }
    choice = randSeedItem(curChoices);
  }, seedOffset);

  // Bang is safe since there are at least `seedOffset` choices, so the method above is guaranteed to set `choice`
  return choice!;
}
