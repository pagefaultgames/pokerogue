/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { Pokemon } from "#field/pokemon";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import type { Status } from "#data/status-effect";
import { StatusEffect } from "#enums/status-effect";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { NonFunctionPropertiesRecursive } from "#types/type-helpers";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

export type expectedType =
  | StatusEffect
  | { effect: StatusEffect.TOXIC; toxicTurnCount: number }
  | { effect: StatusEffect.SLEEP; sleepTurnsRemaining: number };

/**
 * Matcher to check if a Pokemon's {@linkcode StatusEffect} is as expected
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedStatus - The {@linkcode StatusEffect} the Pokemon is expected to have,
 * or a partially filled {@linkcode Status} containing the desired properties
 * @returns Whether the matcher passed
 */
export function toHaveStatusEffectMatcher(
  this: MatcherState,
  received: unknown,
  expectedStatus: expectedType,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  // Convert to Status
  const expStatus: { effect: StatusEffect } & Partial<NonFunctionPropertiesRecursive<Status>> =
    typeof expectedStatus === "number"
      ? {
          effect: expectedStatus,
        }
      : expectedStatus;

  // If expected to have no status,
  if (expStatus.effect === StatusEffect.NONE) {
    k;
  }

  const actualStatus = received.status;
  const pass = this.equals(received, expectedStatus, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  const pkmName = getPokemonNameWithAffix(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} NOT to have ${expectedStatusEffectStr}, but it did!`
        : `Expected ${pkmName} to have status effect: ${expectedStatusEffectStr}, but got: ${actualStatusEffectStr}!`,
  };
}
