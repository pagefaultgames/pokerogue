import { getPokemonNameWithAffix } from "#app/messages";
import type { EffectiveStat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { getStatName } from "#test/utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/utils/test-utils";
import type { GetEffectiveStatParams } from "#types/pokemon-common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

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
  options?: GetEffectiveStatParams,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  // Bangs are safe here since they will just
  const actualValue = received.getEffectiveStat(stat, options);
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
