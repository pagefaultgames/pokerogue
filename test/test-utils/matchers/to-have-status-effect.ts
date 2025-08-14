/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { Status } from "#data/status-effect";
import type { Pokemon } from "#field/pokemon";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import { StatusEffect } from "#enums/status-effect";
import { getEnumStr, getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

export type expectedStatusType =
  | StatusEffect
  | { effect: StatusEffect.TOXIC; toxicTurnCount: number }
  | { effect: StatusEffect.SLEEP; sleepTurnsRemaining: number };

/**
 * Matcher that checks if a Pokemon's {@linkcode StatusEffect} is as expected
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedStatus - The {@linkcode StatusEffect} the Pokemon is expected to have,
 * or a partially filled {@linkcode Status} containing the desired properties
 * @returns Whether the matcher passed
 */
export function toHaveStatusEffect(
  this: MatcherState,
  received: unknown,
  expectedStatus: expectedStatusType,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);
  const actualEffect = received.status?.effect ?? StatusEffect.NONE;

  // Check exclusively effect equality first, coercing non-matching status effects to numbers.
  if (typeof expectedStatus === "object" && actualEffect !== expectedStatus.effect) {
    expectedStatus = expectedStatus.effect;
  }

  if (typeof expectedStatus === "number") {
    const pass = this.equals(actualEffect, expectedStatus, [...this.customTesters, this.utils.iterableEquality]);

    const actualStr = getEnumStr(StatusEffect, actualEffect, { prefix: "StatusEffect." });
    const expectedStr = getEnumStr(StatusEffect, expectedStatus, { prefix: "StatusEffect." });

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${pkmName} to NOT have ${expectedStr}, but it did!`
          : `Expected ${pkmName} to have status effect ${expectedStr}, but got ${actualStr} instead!`,
      expected: expectedStatus,
      actual: actualEffect,
    };
  }

  // Check for equality of all fields (for toxic turn count/etc)
  const actualStatus = received.status;
  const pass = this.equals(received, expectedStatus, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  const expectedStr = getOnelineDiffStr.call(this, expectedStatus);
  const actualStr = getOnelineDiffStr.call(this, actualStatus);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s status to NOT match ${expectedStr}, but it did!`
        : `Expected ${pkmName}'s status to match ${expectedStr}, but got ${actualStr} instead!`,
    expected: expectedStatus,
    actual: actualStatus,
  };
}
