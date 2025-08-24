import { getPokemonNameWithAffix } from "#app/messages";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { Pokemon } from "#field/pokemon";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a {@linkcode Pokemon} is at full hp.
 * @param received - The object to check. Should be a {@linkcode Pokemon}.
 * @returns Whether the matcher passed
 */
export function toHaveFullHp(this: MatcherState, received: unknown): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
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
    expected: maxHp,
    actual: hp,
  };
}
