import { getPokemonNameWithAffix } from "#app/messages";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if a Pokemon is full hp.
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @returns Whether the matcher passed
 */
export function toHaveFullHpMatcher(this: MatcherState, received: unknown): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pass = received.isFullHp();

  const hp = received.hp;
  const maxHp = received.getMaxHp();
  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have full hp, but it did!`
        : `Expected ${pkmName} to have full hp, but it didn't! (${hp}/${maxHp} HP)`,
  };
}
