import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { stringifyEnumArray } from "#test/utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/utils/test-utils";
import { coerceArray } from "#utils/array";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHaveTypes}.
 */
export interface ToHaveTypesOptions {
  /**
   * Value dictating the strength of the enforced typing match.
   *
   * Possible values (in descending order of strictness) are:
   * - `"ordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **and in the same order**
   * - `"unordered"`: Enforce that the Pokemon's types are identical **without checking order**
   * - `"superset"`: Enforce that the Pokemon's types are **a superset of** the expected types
   *   (all must be present, but extras can be there)
   * - `"oneOf"`: Enforce that the Pokemon's types include at least one of the expected types
   *   (the existence of additional types does not matter)
   * @defaultValue `"unordered"`
   */
  mode?: "ordered" | "unordered" | "superset" | "oneOf";
  /**
   * (Optional) Arguments to pass to {@linkcode Pokemon.getTypes}.
   */
  args?: Parameters<Pokemon["getTypes"]>[0];
}

/**
 * Matcher that checks if a Pokemon's typing is as expected.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedTypes - A single {@linkcode PokemonType} or array of multiple types to compare against
 * @param mode - The mode in which to perform the matching.
 * Possible values (in descending order of strictness) are:
 * - `"ordered"`: Enforce that the {@linkcode Pokemon}'s types are identical **and in the same order**
 * - `"unordered"`: Enforce that the Pokemon's types are identical **without checking order**
 * - `"superset"`: Enforce that the Pokemon's types are **a superset of** the expected types
 *   (all must be present, but extras can be there)
 * - `"oneOf"`: Enforce that the Pokemon's types include at least one of the expected types
 *   (the existence of additional types does not matter)
 *
 * Default: `"unordered"`
 * @param args - Extra arguments passed to {@linkcode Pokemon.getTypes}
 * @returns The result of the matching
 */
export function toHaveTypes(
  this: Readonly<MatcherState>,
  received: unknown,
  expectedTypes: PokemonType | readonly [PokemonType, ...PokemonType[]],
  { mode = "unordered", args = {} }: ToHaveTypesOptions = {},
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
  const actualSorted = mode === "ordered" ? received.getTypes(args) : received.getTypes(args).toSorted();
  const expectedSorted = mode === "ordered" ? expectedTypes : expectedTypes.toSorted();

  const actualStr = stringifyEnumArray(PokemonType, actualSorted);
  const expectedStr = stringifyEnumArray(PokemonType, expectedSorted);
  const pkmName = getPokemonNameWithAffix(received);

  if (mode === "oneOf") {
    const pass = actualSorted.some(v => expectedSorted.includes(v));

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${pkmName}'s types NOT to include any of ${expectedStr}, but it did!`
          : `Expected ${pkmName}'s types to include at least one of ${expectedStr}, but it didn't!`,
      expected: expectedSorted,
      actual: actualSorted,
    };
  }

  // Exact matches do not care about subset equality
  const matchers =
    mode === "superset"
      ? [...this.customTesters, this.utils.iterableEquality]
      : [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality];
  const pass = this.equals(actualSorted, expectedSorted, matchers);

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
