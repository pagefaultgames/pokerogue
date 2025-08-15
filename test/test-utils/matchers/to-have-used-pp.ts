// biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports
import type { Pokemon } from "#field/pokemon";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports

import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { MoveId } from "#enums/move-id";
import { getEnumStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { coerceArray } from "#utils/common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check the amount of PP consumed by a {@linkcode Pokemon}.
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param moveId - The {@linkcode MoveId} that should have consumed PP
 * @param ppUsed - The numerical amount of PP that should have been consumed,
 * or `all` to indicate the move should be _out_ of PP
 * @returns Whether the matcher passed
 * @remarks
 * If the same move appears in the Pokemon's moveset multiple times, this will fail the test!
 */
export function toHaveUsedPP(
  this: MatcherState,
  received: unknown,
  moveId: MoveId,
  ppUsed: number | "all",
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const override = received.isPlayer() ? Overrides.MOVESET_OVERRIDE : Overrides.ENEMY_MOVESET_OVERRIDE;
  if (coerceArray(override).length > 0) {
    return {
      pass: this.isNot,
      message: () =>
        `Cannot test for PP consumption with ${received.isPlayer() ? "player" : "enemy"} moveset overrides active!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);
  const moveStr = getEnumStr(MoveId, moveId);

  const movesetMoves = received.getMoveset().filter(pm => pm.moveId === moveId);
  if (movesetMoves.length !== 1) {
    return {
      pass: this.isNot,
      message: () =>
        `Expected MoveId.${moveStr} to appear in ${pkmName}'s moveset exactly once, but got ${movesetMoves.length} times!`,
      expected: moveId,
      actual: received.getMoveset(),
    };
  }

  const move = movesetMoves[0]; // will be the only move in the array

  let ppStr: string = ppUsed.toString();
  if (typeof ppUsed === "string") {
    ppStr = "all its";
    ppUsed = move.getMovePp();
  }
  const pass = move.ppUsed === ppUsed;

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveStr} to NOT have used ${ppStr} PP, but it did!`
        : `Expected ${pkmName}'s ${moveStr} to have used ${ppStr} PP, but got ${move.ppUsed} instead!`,
    expected: ppUsed,
    actual: move.ppUsed,
  };
}
