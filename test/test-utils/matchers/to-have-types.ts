import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";
import { isPokemonInstance, receivedStr } from "../test-utils";

export interface toHaveTypesOptions {
  /**
   * Whether to enforce exact matches (`true`) or superset matches (`false`).
   * @defaultValue `true`
   */
  exact?: boolean;
  /**
   * Optional arguments to pass to {@linkcode Pokemon.getTypes}.
   */
  args?: Parameters<(typeof Pokemon.prototype)["getTypes"]>;
}

/**
 * Matcher to check if an array contains exactly the given items, disregarding order.
 * @param received - The object to check. Should be an array of one or more {@linkcode PokemonType}s.
 * @param options - The {@linkcode toHaveTypesOptions | options} for this matcher
 * @returns The result of the matching
 */
export function toHaveTypes(
  this: MatcherState,
  received: unknown,
  expected: unknown,
  options: toHaveTypesOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to recieve a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  if (!Array.isArray(expected) || expected.length === 0) {
    return {
      pass: false,
      message: () => `Expected to receive an array with length >=1, but got ${this.utils.stringify(expected)}!`,
    };
  }

  if (!expected.every((t): t is PokemonType => t in PokemonType)) {
    return {
      pass: false,
      message: () => `Expected to receive array of PokemonTypes but got ${this.utils.stringify(expected)}!`,
    };
  }

  const actualSorted = stringifyEnumArray(PokemonType, received.getTypes(...(options.args ?? [])).sort());
  const expectedSorted = stringifyEnumArray(PokemonType, expected.slice().sort());
  const matchers = options.exact
    ? [...this.customTesters, this.utils.iterableEquality]
    : [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality];
  const pass = this.equals(actualSorted, expectedSorted, matchers);

  return {
    pass,
    message: () =>
      `Expected ${getPokemonNameWithAffix(received)} to have types ${this.utils.stringify(expectedSorted)}, but got ${actualSorted}!`,
    actual: actualSorted,
    expected: expectedSorted,
  };
}
