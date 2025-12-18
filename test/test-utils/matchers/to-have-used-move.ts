import { getPokemonNameWithAffix } from "#app/messages";
import { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import type { OneOther } from "#test/@types/test-helpers";
import { getEnumStr, getOnelineDiffStr, getOrdinal } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { TurnMove } from "#types/turn-move";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check the contents of a {@linkcode Pokemon}'s move history.
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedMove - The {@linkcode MoveId} the Pokemon is expected to have used,
 * or a partially filled {@linkcode TurnMove} containing the desired properties to check
 * @param index - The index of the move history entry to check, in order from most recent to least recent;
 * default `0` (last used move)
 * @returns Whether the matcher passed
 */
export function toHaveUsedMove(
  this: MatcherState,
  received: unknown,
  expectedMove: MoveId | OneOther<TurnMove, "move">,
  index = 0,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const historyMove: TurnMove | undefined = received.getLastXMoves(-1)[index];
  const pkmName = getPokemonNameWithAffix(received);

  if (historyMove === undefined) {
    return {
      pass: this.isNot,
      message: () => `Expected ${pkmName} to have used ${index + 1} moves, but it didn't!`,
      actual: received.getLastXMoves(-1),
    };
  }

  const moveIndexStr = index === 0 ? "last move" : `${getOrdinal(index)} most recent move`;

  // Break out early if a move-only comparison was done or if the move ID did not match
  const expectedId = typeof expectedMove === "number" ? expectedMove : expectedMove.move;
  const actualId = historyMove.move;
  const sameId = this.equals(actualId, expectedId, this.customTesters);

  if (typeof expectedMove === "number" || !sameId) {
    const expectedIdStr = getEnumStr(MoveId, expectedId);
    const actualIdStr = getEnumStr(MoveId, actualId);
    return {
      pass: sameId,
      // Expected Magikarp' 5th most recent move to be PHOTON_GEYSER, but got METRONOME instead!
      message: () =>
        sameId
          ? `Expected ${pkmName}'s ${moveIndexStr} to NOT be ${expectedIdStr}, but it was!`
          : `Expected ${pkmName}'s ${moveIndexStr} to be ${expectedIdStr}, but got ${actualIdStr} instead!`,
      expected: expectedMove,
      actual: historyMove,
    };
  }

  // Compare equality with the provided object
  const pass = this.equals(historyMove, expectedMove, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  const expectedStr = getOnelineDiffStr.call(this, expectedMove);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveIndexStr} to NOT match ${expectedStr}, but it did!`
        : `Expected ${pkmName}'s ${moveIndexStr} to match ${expectedStr}, but it didn't!`,
    expected: expectedMove,
    actual: historyMove,
  };
}
