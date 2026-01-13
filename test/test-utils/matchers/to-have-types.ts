import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { coerceArray } from "#utils/array";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHaveTypes}.
 */
export interface ToHaveTypesOptions {
  /**
   * Value dictating the strength of the enforced typing match.
   *
   * Possible values (in ascending order of strength) are:
   * - `"ordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **and in the same order**
   * - `"unordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **without checking order**
   * - `"superset"`: Enforce that the {@linkcode Pokemon}'s types are **a superset of** the expected types
   * (all must be present, but extras can be there)
   * @defaultValue `"unordered"`
   */
  mode?: "ordered" | "unordered" | "superset";
  /**
   * Optional arguments to pass to {@linkcode Pokemon.getTypes}.
   */
  // TODO: Change this to use object spread once `Pokemon.getTypes` has its parameters coaclesced into an object
  args?: Parameters<Pokemon["getTypes"]>;
}

/**
 * Matcher that checks if a Pokemon's typing is as expected.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedTypes - A single {@linkcode PokemonType} or array of multiple types to compare against
 * @param mode - The mode to perform the matching in.
 * Possible values (in ascending order of strength) are:
 * - `"ordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **and in the same order**
 * - `"unordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **without checking order**
 * - `"superset"`: Enforce that the {@linkcode Pokemon}'s types are **a superset of** the expected types
 * (all must be present, but extras can be there)
 *
 * Default: `unordered`
 * @param args - Extra arguments passed to {@linkcode Pokemon.getTypes}
 * @returns The result of the matching
 */
export function toHaveTypes(
  this: Readonly<MatcherState>,
  received: unknown,
  expectedTypes: PokemonType | readonly [PokemonType, ...PokemonType[]],
  { mode = "unordered", args = [] }: ToHaveTypesOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  expectedTypes = coerceArray(expectedTypes);

  // Return early if no types were passed in
  if (expectedTypes.length === 0) {
    return {
      pass: this.isNot,
      message: () => "Expected to receive a non-empty array of PokemonTypes!",
    };
  }

  // Avoid sorting the types if strict ordering is desired
  const actualSorted = mode === "ordered" ? received.getTypes(...args) : received.getTypes(...args).toSorted();
  const expectedSorted = mode === "ordered" ? expectedTypes : expectedTypes.toSorted();

  // Exact matches do not care about subset equality
  const matchers =
    mode === "superset"
      ? [...this.customTesters, this.utils.iterableEquality]
      : [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality];
  const pass = this.equals(actualSorted, expectedSorted, matchers);

  const actualStr = stringifyEnumArray(PokemonType, actualSorted);
  const expectedStr = stringifyEnumArray(PokemonType, expectedSorted);
  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have types ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have types ${expectedStr}, but got ${actualStr} instead!`,
    expected: expectedSorted,
    actual: actualSorted,
  };
}
