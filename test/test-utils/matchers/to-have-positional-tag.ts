import type { toSerializedPosTag } from "#data/positional-tags/load-positional-tag";
import { PositionalTag } from "#data/positional-tags/positional-tag";
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
 * @param count - (Default `1`) The number of tags that should be active; must be an integer within the range `[1, 4]`.
 * Negative matches will disregard this and instead assert that **no** tags were found.
 * @returns The result of the matching
 */
export function toHavePositionalTag<P extends PositionalTagType>(
  this: Readonly<MatcherState>,
  received: unknown,
  expectedTag: P | toHavePositionalTagOptions<P>,
  count = this.isNot ? 0 : 1,
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

  const countValid = this.isNot
    ? count === 0
    : // TODO: Increase upper bound if triple battles are added
      Number.isSafeInteger(count) && isBetween(count, 1, 4);

  if (!countValid) {
    return {
      pass: this.isNot,
      message: () =>
        this.isNot
          ? `Expected count to be 0, but got ${count} instead!`
          : `Expected count to be an integer between 1 and 4, but got ${count} instead!`,
    };
  }

  const { tags: allTags } = received.scene.arena.positionalTagManager;
  const tagType = typeof expectedTag === "string" ? expectedTag : expectedTag.tagType;
  const matchingTags = allTags.filter(t => t.tagType === tagType);

  // If checking exclusively tag type, check solely the number of matching tags on field.
  if (typeof expectedTag === "string") {
    const hasTags = matchingTags.length === count;
    const expectedStr = getPosTagStr(expectedTag, count);

    // Since vitest checks based off a local copy of `isNot` (see `@vitest/expect/index.js`), we adjust return manually to account for custom behaviour
    return {
      pass: hasTags !== this.isNot,
      message: () => `Expected the Arena to have ${expectedStr} active, but got ${matchingTags.length} instead!`,
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
  switch (count) {
    case 0:
      return `no ${tagStr}s`;
    case 1:
      return `a single ${tagStr}`;
    default:
      return `${count} ${tagStr}s`;
  }
}
