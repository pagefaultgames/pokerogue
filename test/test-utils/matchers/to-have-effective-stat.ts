import { getPokemonNameWithAffix } from "#app/messages";
import type { EffectiveStat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { getStatName } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHaveEffectiveStat}.
 * @see {@linkcode Pokemon.getEffectiveStat}
 * @sealed
 */
// TODO: Rework to simply use whatever config object is used for `Pokemon#getEffectiveStat`
// once that has its params consolidated
export interface ToHaveEffectiveStatOptions {
  /**
   * The target {@linkcode Pokemon}
   */
  enemy?: Pokemon;
  /**
   * The {@linkcode Move} being used
   */
  move?: Move;
  /**
   * Whether a critical hit occurred or not
   * @defaultValue `false`
   */
  isCritical?: boolean;
}

/**
 * Matcher that checks if a {@linkcode Pokemon}'s effective stat equals a certain value.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param stat - The {@linkcode EffectiveStat} to check
 * @param expectedValue - The expected value of `stat`; must be a non-negative integer
 * @param options - The {@linkcode ToHaveEffectiveStatOptions}
 * @returns Whether the matcher passed
 */
export function toHaveEffectiveStat(
  this: Readonly<MatcherState>,
  received: unknown,
  stat: EffectiveStat,
  expectedValue: number,
  { enemy, move, isCritical = false }: ToHaveEffectiveStatOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  // TODO: Change once getEffectiveStat is refactored to take an object literal
  const actualValue = received.getEffectiveStat(stat, enemy, move, undefined, undefined, undefined, isCritical);
  const pass = actualValue === expectedValue;

  const pkmName = getPokemonNameWithAffix(received);
  const statName = getStatName(stat);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have ${expectedValue} ${statName}, but it did!`
        : `Expected ${pkmName} to have ${expectedValue} ${statName}, but got ${actualValue} instead!`,
    expected: expectedValue,
    actual: actualValue,
  };
}
