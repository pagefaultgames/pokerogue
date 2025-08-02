/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { Pokemon } from "#field/pokemon";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import type { MoveId } from "#enums/move-id";
import { getOnelineDiffStr, getOrdinal } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { TurnMove } from "#types/turn-move";
import type { AtLeastOne } from "#types/type-helpers";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check the contents of a {@linkcode Pokemon}'s move history.
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedValue - The {@linkcode MoveId} the Pokemon is expected to have used,
 * or a partially filled {@linkcode TurnMove} containing the desired properties to check
 * @param index - The index of the move history entry to check, in order from most recent to least recent.
 * Default `0` (last used move)
 * @returns Whether the matcher passed
 */
export function toHaveUsedMove(
  this: MatcherState,
  received: unknown,
  expectedResult: MoveId | AtLeastOne<TurnMove>,
  index = 0,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const move: TurnMove | undefined = received.getLastXMoves(-1)[index];
  const pkmName = getPokemonNameWithAffix(received);

  if (move === undefined) {
    return {
      pass: false,
      message: () => `Expected ${pkmName} to have used ${index + 1} moves, but it didn't!`,
      actual: received.getLastXMoves(-1),
    };
  }

  // Coerce to a `TurnMove`
  if (typeof expectedResult === "number") {
    expectedResult = { move: expectedResult };
  }

  const moveIndexStr = index === 0 ? "last move" : `${getOrdinal(index)} most recent move`;

  const pass = this.equals(move, expectedResult, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  const expectedStr = getOnelineDiffStr.call(this, expectedResult);
  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveIndexStr} to NOT match ${expectedStr}, but it did!`
        : // Replace newlines with spaces to preserve one-line ness
          `Expected ${pkmName}'s ${moveIndexStr} to match ${expectedStr}, but it didn't!`,
    expected: expectedResult,
    actual: move,
  };
}
