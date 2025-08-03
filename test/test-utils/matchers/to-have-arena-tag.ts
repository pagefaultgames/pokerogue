import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
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
 * @param expectedTag - The {@linkcode ArenaTagType} of the desired tag, or a partially-filled object
 * containing the desired properties
 * @param side - The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
 * {@linkcode ArenaTagSide.BOTH} to check both sides
 * @returns The result of the matching
 */
export function toHaveArenaTag<T extends ArenaTagType>(
  this: MatcherState,
  received: unknown,
  // simplified types used for brevity; full overloads are in `vitest.d.ts`
  expectedTag: T | (Partial<NonFunctionPropertiesRecursive<ArenaTag>> & { tagType: T; side: ArenaTagSide }),
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

  if (typeof expectedTag === "string") {
    // Coerce lone `tagType`s into objects
    // Bangs are ok as we enforce safety via overloads
    expectedTag = { tagType: expectedTag, side: side! };
  }

  // We need to get all tags for the case of checking properties of a tag present on both sides of the arena
  const tags = received.scene.arena.findTagsOnSide(t => t.tagType === expectedTag.tagType, expectedTag.side);
  if (tags.length === 0) {
    return {
      pass: false,
      message: () => `Expected the Arena to have a tag of type ${expectedTag.tagType}, but it didn't!`,
      expected: expectedTag.tagType,
      actual: received.scene.arena.tags.map(t => t.tagType),
    };
  }

  // Pass if any of the matching tags meet our criteria
  const pass = tags.some(tag =>
    this.equals(tag, expectedTag, [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality]),
  );

  const expectedStr = getOnelineDiffStr.call(this, expectedTag);
  return {
    pass,
    message: () =>
      pass
        ? `Expected the Arena to NOT have a tag matching ${expectedStr}, but it did!`
        : `Expected the Arena to have a tag matching ${expectedStr}, but it didn't!`,
    expected: expectedTag,
    actual: tags,
  };
}
