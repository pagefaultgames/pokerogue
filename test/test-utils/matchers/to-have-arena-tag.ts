import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

// intersection required to preserve T for inferences
export type toHaveArenaTagOptions<T extends ArenaTagType> = OneOther<ArenaTagTypeMap[T], "tagType" | "side"> & {
  tagType: T;
};

/**
 * Matcher to check if the {@linkcode Arena} has a given {@linkcode ArenaTag} active.
 * @param received - The object to check. Should be the current {@linkcode GameManager}.
 * @param expectedTag - The `ArenaTagType` of the desired tag, or a partially-filled object
 * containing the desired properties
 * @param side - The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
 * {@linkcode ArenaTagSide.BOTH} to check both sides
 * @returns The result of the matching
 */
export function toHaveArenaTag<T extends ArenaTagType>(
  this: MatcherState,
  received: unknown,
  expectedTag: T | toHaveArenaTagOptions<T>,
  side: ArenaTagSide = ArenaTagSide.BOTH,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: this.isNot,
      message: () => `Expected GameManager.${received.scene ? "scene.arena" : "scene"} to be defined!`,
    };
  }

  // Coerce lone `tagType`s into objects
  // Bangs are ok as we enforce safety via overloads
  // @ts-expect-error - Typescript is being stupid as tag type and side will always exist
  const etag: Partial<ArenaTag> & { tagType: T; side: ArenaTagSide } =
    typeof expectedTag === "object" ? expectedTag : { tagType: expectedTag, side };

  // If checking only tag type/side OR no tags were found, break out early.
  // We need to get all tags for the case of checking properties of a tag present on both sides of the arena
  const tags = received.scene.arena.findTagsOnSide(t => t.tagType === etag.tagType, etag.side);
  if (typeof expectedTag !== "object" || tags.length === 0) {
    const pass = tags.length > 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected the Arena to NOT have a tag of type ${etag.tagType}, but it did!`
          : `Expected the Arena to have a tag of type ${etag.tagType}, but it didn't!`,
      expected: etag,
      actual: received.scene.arena.tags.map(t => ({ tagType: t.tagType, side: t.side })),
    };
  }

  // Pass if any of the matching tags meet our criteria
  const pass = tags.some(tag =>
    this.equals(tag, etag, [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality]),
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
