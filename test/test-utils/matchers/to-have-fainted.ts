import { getPokemonNameWithAffix } from "#app/messages";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if a Pokemon has fainted.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @returns Whether the matcher passed
 */
export function toHaveFaintedMatcher(this: MatcherState, received: unknown): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const { hp } = received;
  const maxHp = received.getMaxHp();
  const pass = received.isFainted();

  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} NOT to have fainted, but it did! (${hp}/${maxHp} HP)`
        : `Expected ${pkmName} to have fainted, but it did not. (${hp}/${maxHp} HP)`,
  };
}
