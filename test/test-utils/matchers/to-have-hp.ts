import { getPokemonNameWithAffix } from "#app/messages";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if a Pokemon has a specific amount of HP
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @param expectedHp - The expected amount of HP the {@linkcode Pokemon} has
 * @returns Whether the matcher passed
 */
export function toHaveHpMatcher(this: MatcherState, received: unknown, expectedHp: number): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const actualHp = received.hp;
  const pass = actualHp === expectedHp;

  const pkmName = getPokemonNameWithAffix(received);
  const maxHp = received.getMaxHp();

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have ${expectedHp}/${maxHp} HP, but it did!`
        : `Expected ${pkmName} to have ${expectedHp}/${maxHp} HP, but found ${actualHp}/${maxHp} HP.`,
  };
}
