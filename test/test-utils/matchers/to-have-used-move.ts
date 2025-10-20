/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { Pokemon } from "#field/pokemon";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import { MoveId } from "#enums/move-id";
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

  const move: TurnMove | undefined = received.getLastXMoves(-1)[index];
  const pkmName = getPokemonNameWithAffix(received);

  if (move === undefined) {
    return {
      pass: this.isNot,
      message: () => `Expected ${pkmName} to have used ${index + 1} moves, but it didn't!`,
      actual: received.getLastXMoves(-1),
    };
  }

  // Coerce to a `TurnMove` if only 1 property was passed
  let onlyMove = false;
  let moveObj: Partial<TurnMove> & Pick<TurnMove, "move">;
  if (typeof expectedMove === "number") {
    moveObj = { move: expectedMove };
    onlyMove = true;
  } else {
    moveObj = expectedMove;
  }

  const moveIndexStr = index === 0 ? "last move" : `${getOrdinal(index)} most recent move`;

  const pass = this.equals(move, moveObj, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  // Customize the diff message if a single move was passed
  const expectedStr = onlyMove
    ? `be MoveId.${getEnumStr(MoveId, moveObj.move)}`
    : `match ${getOnelineDiffStr.call(this, expectedMove)}`;
  const notVerb = onlyMove ? "was" : "did";

  return {
    pass,
    message: () =>
      pass
        ? // Expected Magikarp' 5th most recent move to be MoveId.PHOTON_GEYSER, but it wasn't!
          `Expected ${pkmName}'s ${moveIndexStr} to NOT ${expectedStr}, but it ${notVerb}!`
        : `Expected ${pkmName}'s ${moveIndexStr} to ${expectedStr}, but it ${notVerb}n't!`,
    expected: expectedMove,
    actual: move,
  };
}
