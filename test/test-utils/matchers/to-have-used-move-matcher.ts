import { getPokemonNameWithAffix } from "#app/messages";
import type { MoveId } from "#enums/move-id";
// biome-ignore lint/correctness/noUnusedImports: TSDocs
import type { Pokemon } from "#field/pokemon";
import { getOrdinal } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { TurnMove } from "#types/turn-move";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if a {@linkcode Pokemon} has used a specific {@linkcode MoveId} at the given .
 * @param received - The actual value received. Should be a {@linkcode Pokemon}
 * @param expectedValue - The expected value; can be a {@linkcode MoveId} or a partially filled {@linkcode TurnMove}
 * @param index - The index of the move history entry to check, in order from most recent to least recent.
 * Default `0` (last used move)
 * @returns Whether the matcher passed
 */
export function toHaveUsedMoveMatcher(
  this: MatcherState,
  received: unknown,
  expectedResult: MoveId | Partial<TurnMove>,
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

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName}'s ${moveIndexStr} NOT to match ${this.utils.stringify(expectedResult)}, but it did!`
        : `Expected ${pkmName}'s ${moveIndexStr} to match ${this.utils.stringify(expectedResult)}, but got ${this.utils.stringify(move)}!`,
    expected: expectedResult,
    actual: move,
  };
}
