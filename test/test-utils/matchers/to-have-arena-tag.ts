import type { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
import { getEnumStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if the {@linkcode Arena} has a given {@linkcode ArenaTag} active.
 * @param received - The object to check. Should be the current {@linkcode GameManager}.
 * @param expectedType - The {@linkcode ArenaTagType} of the desired tag
 * @param side - The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
 * {@linkcode ArenaTagSide.BOTH} to check both sides.
 * @param options - The options passed to this matcher
 * @returns The result of the matching
 */
export function toHaveArenaTag(
  this: MatcherState,
  received: unknown,
  expectedType: ArenaTagType,
  side: ArenaTagSide,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: false,
      message: () => `Expected to recieve a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: false,
      message: () => `Expected GameManager.${received.scene ? "scene" : "scene.arena"} to be defined!`,
    };
  }

  const tag = received.scene.arena.getTagOnSide(expectedType, side);
  const pass = !!tag;
  const expectedStr = getEnumStr(ArenaTagType, expectedType);
  return {
    pass,
    message: () =>
      pass
        ? `Expected the arena to NOT have a tag matching ${expectedStr}, but it did!`
        : // Replace newlines with spaces to preserve one-line ness
          `Expected the arena to have a tag matching ${expectedStr}, but it didn't!`,
    expected: getEnumStr(ArenaTagType, expectedType),
    actual: stringifyEnumArray(
      ArenaTagType,
      received.scene.arena.tags.map(t => t.tagType),
    ),
  };
}
