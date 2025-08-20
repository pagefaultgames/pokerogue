import { getPokemonNameWithAffix } from "#app/messages";
import type { EffectiveStat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { getStatName } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

export interface toHaveEffectiveStatOptions {
  /**
   * The target {@linkcode Pokemon}
   * @see {@linkcode Pokemon.getEffectiveStat}
   */
  enemy?: Pokemon;
  /**
   * The {@linkcode Move} being used
   * @see {@linkcode Pokemon.getEffectiveStat}
   */
  move?: Move;
  /**
   * Whether a critical hit occurred or not
   * @see {@linkcode Pokemon.getEffectiveStat}
   * @defaultValue `false`
   */
  isCritical?: boolean;
}

/**
 * Matcher that checks if a {@linkcode Pokemon}'s effective stat equals a certain value.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param stat - The {@linkcode EffectiveStat} to check
 * @param expectedValue - The expected value of the {@linkcode stat}
 * @param options - The {@linkcode toHaveEffectiveStatOptions}
 * @returns Whether the matcher passed
 */
export function toHaveEffectiveStat(
  this: MatcherState,
  received: unknown,
  stat: EffectiveStat,
  expectedValue: number,
  { enemy, move, isCritical = false }: toHaveEffectiveStatOptions = {},
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
