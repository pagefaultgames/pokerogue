// biome-ignore-start lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc

import type { serializedPosTagMap } from "#data/positional-tags/load-positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import { toTitleCase } from "#utils/strings";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

export type toHavePositionalTagOptions<P extends PositionalTagType> = OneOther<serializedPosTagMap[P], "tagType"> & {
  tagType: P;
};

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
  if (count < 0 || count > 4) {
    return {
      pass: this.isNot,
      message: () => `Expected count to be between 0 and 4, but got ${count} instead!`,
    };
  }

  const allTags = received.scene.arena.positionalTagManager.tags;
  const tagType = typeof expectedTag === "string" ? expectedTag : expectedTag.tagType;
  const matchingTags = allTags.filter(t => t.tagType === tagType);

  // If checking exclusively tag type, check solely the number of matching tags on field
  if (typeof expectedTag === "string") {
    const pass = matchingTags.length === count;
    const expectedStr = getPosTagStr(expectedTag);

    return {
      pass,
      message: () =>
        pass
          ? `Expected the Arena to NOT have ${count} ${expectedStr} active, but it did!`
          : `Expected the Arena to have ${count} ${expectedStr} active, but got ${matchingTags.length} instead!`,
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
      actual: received.scene.arena.tags.map(t => t.tagType),
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

function getPosTagStr(pType: PositionalTagType, count = 1): string {
  let ret = toTitleCase(pType) + "Tag";
  if (count > 1) {
    ret += "s";
  }
  return ret;
}
