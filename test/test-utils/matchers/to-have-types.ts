import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";
import { isPokemonInstance, receivedStr } from "../test-utils";

export interface toHaveTypesOptions {
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
  args?: Parameters<(typeof Pokemon.prototype)["getTypes"]>;
}

/**
 * Matcher that checks if a {@linkcode Pokemon}'s typing is as expected.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expected - An array of one or more {@linkcode PokemonType}s to compare against.
 * @param mode - The mode to perform the matching;
 * @returns The result of the matching
 */
export function toHaveTypes(
  this: MatcherState,
  received: unknown,
  expected: [PokemonType, ...PokemonType[]],
  { mode = "unordered", args = [] }: toHaveTypesOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  // Avoid sorting the types if strict ordering is desired
  const actualTypes = mode === "ordered" ? received.getTypes(...args) : received.getTypes(...args).toSorted();
  const expectedTypes = mode === "ordered" ? expected : expected.toSorted();

  // Exact matches do not care about subset equality
  const matchers =
    mode === "superset"
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
    expected: expectedTypes,
    actual: actualTypes,
  };
}
