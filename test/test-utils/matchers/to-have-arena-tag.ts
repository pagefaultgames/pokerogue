import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
import type { GameManager } from "#test/test-utils/game-manager";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { ArenaTagDataMap, SerializableArenaTagType } from "#types/arena-tags";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Helper type for a partially filled serializable {@linkcode ArenaTag}.
 * Allows for caching to avoid repeated instantiation and speed up typechecking.
 * @typeParam A - The {@linkcode ArenaTagType} being checked
 * @internal
 * @sealed
 */
type PartiallyFilledSerializableArenaTag<A extends SerializableArenaTagType> = //
  OneOther<ArenaTagDataMap[A], "tagType" | "side"> & { tagType: A };

/**
 * Helper type for a partially filled non-serializable {@linkcode ArenaTag}.
 * Allows for caching to avoid repeated instantiation and speed up typechecking.
 * @typeParam A - The {@linkcode ArenaTagType} being checked
 * @internal
 * @sealed
 */
type PartiallyFilledNonSerializableArenaTag<A extends ArenaTagType> = //
  OneOther<ArenaTagTypeMap[A], "tagType" | "side"> & { tagType: A };

/**
 * Parameter type for {@linkcode toHaveArenaTag}, accepting a partially filled {@linkcode ArenaTag} of the given type.
 * @typeParam A - The {@linkcode ArenaTagType} being checked
 * @remarks
 * If `A` corresponds to a {@linkcode SerializableArenaTagType | serializable ArenaTag}, only properties allowed to be serialized
 * (i.e. can change across instances) will be present and able to be checked.
 * @sealed
 */
export type PartiallyFilledArenaTag<A extends ArenaTagType> = [A] extends [SerializableArenaTagType]
  ? PartiallyFilledSerializableArenaTag<A>
  : PartiallyFilledNonSerializableArenaTag<A>;

/**
 * Matcher to check if the {@linkcode Arena} has a given {@linkcode ArenaTag} active.
 * @param received - The object to check. Should be the current {@linkcode GameManager}
 * @param expectedTag - The `ArenaTagType` of the desired tag, or a partially filled object
 * containing the desired properties
 * @param side - (Default {@linkcode ArenaTagSide.BOTH}) The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
 * {@linkcode ArenaTagSide.BOTH} to check both sides
 * @returns The result of the matching
 */
export function toHaveArenaTag<A extends ArenaTagType>(
  this: Readonly<MatcherState>,
  received: unknown,
  expectedTag: A | PartiallyFilledArenaTag<A>,
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
  const etag = typeof expectedTag === "object" ? expectedTag : { tagType: expectedTag, side };

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
