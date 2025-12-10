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

export function shiftCharCodes(str: string, shiftCount: number) {
  if (!shiftCount) {
    shiftCount = 0;
  }

  let newStr = "";

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const newCharCode = charCode + shiftCount;
    newStr += String.fromCharCode(newCharCode);
  }

  return newStr;
}

export function randGauss(stdev: number, mean = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function randSeedGauss(stdev: number, mean = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - randSeedFloat();
  const v = randSeedFloat();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

/**
 * Returns a **completely unseeded** random integer between `min` and `min + range`.
 * @param range - The amount of possible numbers to pick
 * @param min - The minimum number to pick; default `0`
 * @returns A psuedo-random, unseeded integer within the interval [min, min+range].
 * @remarks
 * This should not be used for battles or other outwards-facing randomness;
 * battles are intended to be seeded and deterministic.
 */
export function randInt(range: number, min = 0): number {
  if (range <= 1) {
    return min;
  }
  return Math.floor(Math.random() * range) + min;
}

/**
 * Generate a random integer using the global seed, or the current battle's seed if called via `Battle.randSeedInt`
 * @param range - How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
 * @param min - The minimum integer to pick, default `0`
 * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
 */
export function randSeedInt(range: number, min = 0): number {
  if (range <= 1) {
    return min;
  }
  return Phaser.Math.RND.integerInRange(min, range - 1 + min);
}

/**
 * Generates a random number using the global seed
 * @param min The minimum integer to generate
 * @param max The maximum integer to generate
 * @returns a random integer between {@linkcode min} and {@linkcode max} inclusive
 */
export function randSeedIntRange(min: number, max: number): number {
  return randSeedInt(max - min + 1, min);
}

/**
 * Returns a random integer between min and max (non-inclusive)
 * @param min The lowest number
 * @param max The highest number
 */
export function randIntRange(min: number, max: number): number {
  return randInt(max - min, min);
}

/**
 * Generate and return a random real number between `0` and `1` using the global seed.
 * @returns A random floating-point number between `0` and `1`
 */
export function randSeedFloat(): number {
  return Phaser.Math.RND.frac();
}

export function randItem<T>(items: ArrayLike<T>): T {
  return items.length === 1 ? items[0] : items[randInt(items.length)];
}

export function randSeedItem<T>(items: ArrayLike<T>): T {
  return items.length === 1 ? items[0] : Phaser.Math.RND.pick(items);
}

/**
 * Shuffle a list in place using the seeded rng and the Fisher-Yates algorithm.
 * @param items - An array of items.
 * @returns The same `items` array, now shuffled in place.
 */
export function randSeedShuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Phaser.Math.RND.integerInRange(0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
