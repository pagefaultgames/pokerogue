/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { Pokemon } from "#field/pokemon";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { getEnumStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a {@linkcode Pokemon} has applied a specific {@linkcode AbilityId}.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedAbility - The {@linkcode AbilityId} to check for
 * @returns Whether the matcher passed
 */
export function toHaveAbilityApplied(
  this: MatcherState,
  received: unknown,
  expectedAbilityId: AbilityId,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokemon, but got ${receivedStr(received)}!`,
    };
  }

  const pass = received.waveData.abilitiesApplied.has(expectedAbilityId);

  const pkmName = getPokemonNameWithAffix(received);
  const expectedAbilityStr = getEnumStr(AbilityId, expectedAbilityId);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have applied ${expectedAbilityStr}, but it did!`
        : `Expected ${pkmName} to have applied ${expectedAbilityStr}, but it didn't!`,
    expected: expectedAbilityId,
    actual: received.waveData.abilitiesApplied,
  };
}
