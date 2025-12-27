import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import { getEnumStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { coerceArray } from "#utils/array";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check the amount of PP consumed by a {@linkcode Pokemon}.
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param moveId - The {@linkcode MoveId} that should have consumed PP
 * @param ppUsed - The numerical amount of PP that should have been consumed,
 * or `all` to check that the move is _out_ of PP.
 * Negative values will count backwards from the move's maximum PP.
 * @returns Whether the matcher passed
 * @remarks
 * If the Pokemon's moveset has been set via {@linkcode Overrides.MOVESET_OVERRIDE}/{@linkcode Overrides.ENEMY_MOVESET_OVERRIDE}
 * or does not contain exactly one copy of `moveId`, this will fail the test.
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

  // Special case for 0 PP used to show more accurate diagnostic message
  if (ppUsed === 0) {
    const pass = move.ppUsed === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${pkmName}'s ${moveStr} to NOT have used PP, but it did!`
          : `Expected ${pkmName}'s ${moveStr} to have used PP, but it didn't!`,
      expected: 0,
      actual: move.ppUsed,
    };
  }

  let ppStr = `used ${ppUsed} PP`;
  let ppLeftStr = `${move.ppUsed} PP used`;
  if (typeof ppUsed === "string") {
    ppStr = "used all its PP";
    ppUsed = move.getMovePp();
  } else if (ppUsed < 0) {
    ppStr = `${-ppUsed} PP left`;
    ppLeftStr = `${move.getMovePp() - move.ppUsed} PP left`;
    ppUsed += move.getMovePp(); // -1 turns into maxPP - 1
  }

  const pass = move.ppUsed === ppUsed;

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveStr} to NOT have ${ppStr}, but it did!`
        : `Expected ${pkmName}'s ${moveStr} to have ${ppStr}, but got ${ppLeftStr} instead!`,
    expected: ppUsed,
    actual: move.ppUsed,
  };
}
