import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
import { getEnumStr, getOnelineDiffStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { NonFunctionPropertiesRecursive } from "#types/type-helpers";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

// intersection required to preserve T for inferences
export type toHaveArenaTagOptions<T extends ArenaTagType> = OneOther<ArenaTagTypeMap[T], "tagType" | "side"> & {
  tagType: T;
};

/**
 * Matcher to check if the {@linkcode Arena} has a given {@linkcode ArenaTag} active.
 * @param received - The object to check. Should be the current {@linkcode GameManager}.
 * @param expectedType - The {@linkcode ArenaTagType} of the desired tag, or a partially-filled object
 * containing the desired properties
 * @param side - The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
 * {@linkcode ArenaTagSide.BOTH} to check both sides
 * @returns The result of the matching
 */
export function toHaveArenaTag<T extends ArenaTagType>(
  this: MatcherState,
  received: unknown,
  // simplified types used for brevity; full overloads are in `vitest.d.ts`
  expectedType: T | (Partial<NonFunctionPropertiesRecursive<ArenaTag>> & { tagType: T; side: ArenaTagSide }),
  side?: ArenaTagSide,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: this.isNot,
      message: () => `Expected GameManager.${received.scene ? "scene.arena" : "scene"} to be defined!`,
    };
  }

  if (typeof expectedType === "string") {
    // Coerce lone `tagType`s into objects
    // Bangs are ok as we enforce safety via overloads
    expectedType = { tagType: expectedType, side: side! };
  }

  // We need to get all tags for the case of checking properties of a tag present on both sides of the arena
  const tags = received.scene.arena.findTagsOnSide(t => t.tagType === expectedType.tagType, expectedType.side);
  if (!tags.length) {
    const expectedStr = getEnumStr(ArenaTagType, expectedType.tagType);
    return {
      pass: false,
      message: () => `Expected the arena to have a tag matching ${expectedStr}, but it didn't!`,
      expected: getEnumStr(ArenaTagType, expectedType.tagType),
      actual: stringifyEnumArray(
        ArenaTagType,
        received.scene.arena.tags.map(t => t.tagType),
      ),
    };
  }

  // Pass if any of the matching tags meet our criteria
  const pass = tags.some(tag =>
    this.equals(tag, expectedType, [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality]),
  );

  const expectedStr = getOnelineDiffStr.call(this, expectedType);
  return {
    pass,
    message: () =>
      pass
        ? `Expected the arena to NOT have a tag matching ${expectedStr}, but it did!`
        : `Expected the arena to have a tag matching ${expectedStr}, but it didn't!`,
    expected: expectedType,
    actual: tags,
  };
}
