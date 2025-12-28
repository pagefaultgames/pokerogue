import type { toSerializedPosTag } from "#data/positional-tags/load-positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
import type { GameManager } from "#test/test-utils/game-manager";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import { isBetween } from "#utils/common";
import { toTitleCase } from "#utils/strings";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHavePositionalTag}.
 */
export type toHavePositionalTagOptions<P extends PositionalTagType> = OneOther<toSerializedPosTag<P>, "tagType">;

/**
 * Matcher to check if the {@linkcode Arena} has a certain number of {@linkcode PositionalTag}s active.
 * @param received - The object to check. Should be the current {@linkcode GameManager}
 * @param expectedTag - The {@linkcode PositionalTagType} of the desired tag, or a partially-filled {@linkcode PositionalTag}
 * containing the desired properties
 * @param count - The number of tags that should be active; defaults to `1` and must be within the range `[0, 4]`
 * @returns The result of the matching
 */
export function toHavePositionalTag<P extends PositionalTagType>(
  this: MatcherState,
  received: unknown,
  expectedTag: P | toHavePositionalTagOptions<P>,
  count = 1,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena?.positionalTagManager) {
    return {
      pass: this.isNot,
      message: () =>
        `Expected GameManager.${received.scene?.arena ? "scene.arena.positionalTagManager" : received.scene ? "scene.arena" : "scene"} to be defined!`,
    };
  }

  // TODO: Increase limit if triple battles are added
  if (!isBetween(count, 1, 4)) {
    return {
      pass: this.isNot,
      message: () => `Expected count to be between 0 and 4, but got ${count} instead!`,
    };
  }

  const { tags: allTags } = received.scene.arena.positionalTagManager;
  const tagType = typeof expectedTag === "string" ? expectedTag : expectedTag.tagType;
  const matchingTags = allTags.filter(t => t.tagType === tagType);

  // If checking exclusively tag type, check solely the number of matching tags on field
  if (typeof expectedTag === "string") {
    const pass = matchingTags.length === count;
    const expectedStr = getPosTagStr(expectedTag, count);

    return {
      pass,
      message: () =>
        pass
          ? `Expected the Arena to NOT have ${expectedStr} active, but it did!`
          : `Expected the Arena to have ${expectedStr} active, but got ${matchingTags.length} instead!`,
      expected: expectedTag,
      actual: allTags,
    };
  }

  // Check for equality with the provided object
  if (matchingTags.length === 0) {
    return {
      pass: false,
      message: () => `Expected the Arena to have a tag of type ${expectedTag.tagType}, but it didn't!`,
      expected: expectedTag.tagType,
      actual: allTags.map(t => t.tagType),
    };
  }

  // Pass if any of the matching tags meet the criteria
  const pass = matchingTags.some(tag =>
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
    actual: matchingTags,
  };
}

/**
 * Helper function to coerce a {@linkcode PositionalTagType} into a string.
 * @param tagType - The type of tag being stringified
 * @param count - The expected number of said tag that should be active
 */
function getPosTagStr(tagType: PositionalTagType, count: number): string {
  const tagStr = toTitleCase(tagType) + "Tag";
  if (count === 1) {
    return `a single ${tagStr}`;
  }
  return `${count} ${tagStr}s`;
}
