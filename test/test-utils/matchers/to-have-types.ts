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
  expected: [PokemonType, ...PokemonType[]],
  options: toHaveTypesOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to recieve a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const actualTypes = received.getTypes(...(options.args ?? [])).sort();
  const expectedTypes = expected.slice().sort();

  // Exact matches do not care about subset equality
  const matchers = options.exact
    ? [...this.customTesters, this.utils.iterableEquality]
    : [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality];
  const pass = this.equals(actualTypes, expectedTypes, matchers);

  const actualStr = stringifyEnumArray(PokemonType, actualTypes);
  const expectedStr = stringifyEnumArray(PokemonType, expectedTypes);
  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have types ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have types ${expectedStr}, but got ${actualStr} instead!`,
    actual: actualTypes,
    expected: expectedTypes,
  };
}
