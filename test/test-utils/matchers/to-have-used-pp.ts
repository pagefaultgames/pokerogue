import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { MoveId } from "#enums/move-id";
// biome-ignore lint/correctness/noUnusedImports: TSDocs
import type { Pokemon } from "#field/pokemon";
import { getEnumStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { coerceArray } from "#utils/common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check the amount of PP consumed by a {@linkcode Pokemon}.
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedValue - The {@linkcode MoveId} that should have consumed PP
 * @param ppUsed - The amount of PP that should have been consumed
 * @returns Whether the matcher passed
 * @remarks
 * If the same move appears in the Pokemon's moveset multiple times, this will fail the test!
 */
export function toHaveUsedPP(
  this: MatcherState,
  received: unknown,
  expectedMove: MoveId,
  ppUsed: number,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const override = received.isPlayer() ? Overrides.MOVESET_OVERRIDE : Overrides.OPP_MOVESET_OVERRIDE;
  if (coerceArray(override).length > 0) {
    return {
      pass: false,
      message: () =>
        `Cannot test for PP consumption with ${received.isPlayer() ? "player" : "enemy"} moveset overrides active!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);
  const moveStr = getEnumStr(MoveId, expectedMove);

  const movesetMoves = received.getMoveset().filter(pm => pm.moveId === expectedMove);
  if (movesetMoves.length !== 1) {
    return {
      pass: false,
      message: () =>
        `Expected MoveId.${moveStr} to appear in ${pkmName}'s moveset exactly once, but got ${movesetMoves.length} times!`,
      actual: received.getMoveset(),
    };
  }

  const move = movesetMoves[0];
  const pass = move.ppUsed === ppUsed;

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveStr} to NOT have used ${ppUsed} PP, but it did!`
        : `Expected ${pkmName}'s ${moveStr} to have used ${ppUsed} PP, but got ${move.ppUsed} instead!`,
    expected: ppUsed,
    actual: move.ppUsed,
  };
}
