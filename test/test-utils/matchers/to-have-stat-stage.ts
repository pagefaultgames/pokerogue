/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { Pokemon } from "#field/pokemon";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import type { BattleStat } from "#enums/stat";
import { getStatName } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a Pokemon has a specific {@linkcode BattleStat | Stat} stage.
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @param stat - The {@linkcode BattleStat | Stat} to check
 * @param expectedStage - The expected numerical value of {@linkcode stat}; should be within the range `[-6, 6]`
 * @returns Whether the matcher passed
 */
export function toHaveStatStage(
  this: MatcherState,
  received: unknown,
  stat: BattleStat,
  expectedStage: number,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  if (expectedStage < -6 || expectedStage > 6) {
    return {
      pass: this.isNot,
      message: () => `Expected ${expectedStage} to be within the range [-6, 6]!`,
    };
  }

  const actualStage = received.getStatStage(stat);
  const pass = actualStage === expectedStage;

  const pkmName = getPokemonNameWithAffix(received);
  const statName = getStatName(stat);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${statName} stat stage to NOT be ${expectedStage}, but it was!`
        : `Expected ${pkmName}'s ${statName} stat stage to be ${expectedStage}, but got ${actualStage} instead!`,
    expected: expectedStage,
    actual: actualStage,
  };
}
