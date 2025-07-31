import { PokemonType } from "#enums/pokemon-type";
import { Pokemon } from "#field/pokemon";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

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
  if (!(received instanceof Pokemon)) {
    return {
      pass: this.isNot,
      message: () => `Expected a Pokemon, but got ${this.utils.stringify(received)}!`,
    };
  }

  if (!Array.isArray(expected) || expected.length === 0) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve an array with length >=1, but got ${this.utils.stringify(expected)}!`,
    };
  }

  if (!expected.every((t): t is PokemonType => t in PokemonType)) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve array of PokemonTypes but got ${this.utils.stringify(expected)}!`,
    };
  }

  const gotSorted = pkmnTypeToStr(received.getTypes(...(options.args ?? [])));
  const wantSorted = pkmnTypeToStr(expected.slice());
  const pass = this.equals(gotSorted, wantSorted, [...this.customTesters, this.utils.iterableEquality]);

  return {
    pass: this.isNot !== pass,
    message: () => `Expected ${received.name} to have types ${this.utils.stringify(wantSorted)}, but got ${gotSorted}!`,
    actual: gotSorted,
    expected: wantSorted,
  };
}

function pkmnTypeToStr(p: PokemonType[]): string[] {
  return p.sort().map(type => PokemonType[type]);
}
