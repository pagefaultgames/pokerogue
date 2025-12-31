import { getPokemonNameWithAffix } from "#app/messages";
import type { Pokemon } from "#field/pokemon";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { toDmgValue } from "#utils/common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHaveHp}.
 * @sealed
 */
export interface ToHaveHpOptions {
  /**
   * The rounding method to use when coercing hp counts to an integer.
   * Possible values are `"down"` (for {@linkcode toDmgValue}) and `"half up"` (for "Math.round")
   * @defaultValue `"down"`
   */
  rounding?: "down" | "half up";
}

/**
 * Matcher that checks if a Pokemon has a specific amount of HP.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedHp - The expected amount of HP the {@linkcode Pokemon} is expected to have;
 * @param __namedParameters - Needed for Typedoc to function
 * @returns Whether the matcher passed
 */
export function toHaveHp(
  this: MatcherState,
  received: unknown,
  expectedHp: number,
  { rounding = "down" }: ToHaveHpOptions = {},
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  switch (rounding) {
    case "down":
      expectedHp = toDmgValue(expectedHp);
      break;
    case "half up":
      expectedHp = Math.round(expectedHp);
      break;
  }

  const actualHp = received.hp;
  const pass = actualHp === expectedHp;

  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have ${expectedHp} HP, but it did!`
        : `Expected ${pkmName} to have ${expectedHp} HP, but got ${actualHp} HP instead!`,
    expected: expectedHp,
    actual: actualHp,
  };
}
