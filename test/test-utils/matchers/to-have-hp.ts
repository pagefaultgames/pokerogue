import { getPokemonNameWithAffix } from "#app/messages";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { Pokemon } from "#field/pokemon";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a Pokemon has a specific amount of HP.
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @param expectedHp - The expected amount of HP the {@linkcode Pokemon} has
 * @returns Whether the matcher passed
 */
export function toHaveHp(this: MatcherState, received: unknown, expectedHp: number): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
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
