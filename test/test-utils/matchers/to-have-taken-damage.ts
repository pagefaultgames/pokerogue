/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { Pokemon } from "#field/pokemon";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { toDmgValue } from "#utils/common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a Pokemon has taken a specific amount of damage.
 * Unless specified, will run the expected damage value through {@linkcode toDmgValue}
 * to round it down and make it a minimum of 1.
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @param expectedDamageTaken - The expected amount of damage the {@linkcode Pokemon} has taken
 * @param roundDown - Whether to round down {@linkcode expectedDamageTaken} with {@linkcode toDmgValue}; default `true`
 * @returns Whether the matcher passed
 */
export function toHaveTakenDamage(
  this: MatcherState,
  received: unknown,
  expectedDamageTaken: number,
  roundDown = true,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const expectedDmgValue = roundDown ? toDmgValue(expectedDamageTaken) : expectedDamageTaken;
  const actualDmgValue = received.getInverseHp();
  const pass = actualDmgValue === expectedDmgValue;
  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have taken ${expectedDmgValue} damage, but it did!`
        : `Expected ${pkmName} to have taken ${expectedDmgValue} damage, but got ${actualDmgValue} instead!`,
    expected: expectedDmgValue,
    actual: actualDmgValue,
  };
}
