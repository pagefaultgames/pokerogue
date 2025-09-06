/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { Pokemon } from "#field/pokemon";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import type { BattlerTagTypeMap } from "#data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { OneOther } from "#test/@types/test-helpers";
import { getEnumStr, getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { BattlerTagDataMap, SerializableBattlerTagType } from "#types/battler-tags";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

// intersection required to preserve T for inferences
/**
 * Options type for {@linkcode toHaveBattlerTag}.
 * @typeParam B - The {@linkcode BattlerTagType} being checked
 * @remarks
 * If B corresponds to a serializable `BattlerTag`, only properties allowed to be serialized
 * (i.e. can change across instances) will be present and able to be checked.
 */
export type toHaveBattlerTagOptions<B extends BattlerTagType> = (B extends SerializableBattlerTagType
  ? OneOther<BattlerTagDataMap[B], "tagType">
  : OneOther<BattlerTagTypeMap[B], "tagType">) & {
  tagType: B;
};

/**
 * Matcher that checks if a {@linkcode Pokemon} has a specific {@linkcode BattlerTag}.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedTag - The `BattlerTagType` of the desired tag, or a partially-filled object
 * containing the desired properties
 * @returns Whether the matcher passed
 */
export function toHaveBattlerTag<B extends BattlerTagType>(
  this: MatcherState,
  received: unknown,
  expectedTag: B | toHaveBattlerTagOptions<B>,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);

  // Coerce lone `tagType`s into objects
  const etag = typeof expectedTag === "object" ? expectedTag : { tagType: expectedTag };
  const gotTag = received.getTag(etag.tagType);

  // If checking exclusively tag type OR no tags were found, break out early.
  if (typeof expectedTag !== "object" || !gotTag) {
    const pass = !!gotTag;
    // "BattlerTagType.SEEDED (=1)"
    const expectedTagStr = getEnumStr(BattlerTagType, etag.tagType, { prefix: "BattlerTagType." });

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${pkmName} to NOT have a tag of type ${expectedTagStr}, but it did!`
          : `Expected ${pkmName} to have a tag of type ${expectedTagStr}, but it didn't!`,
      expected: expectedTag,
      actual: received.summonData.tags.map(t => t.tagType),
    };
  }

  // Check for equality with the provided tag
  const pass = this.equals(gotTag, etag, [
    ...this.customTesters,
    this.utils.subsetEquality,
    this.utils.iterableEquality,
  ]);

  const expectedStr = getOnelineDiffStr.call(this, expectedTag);
  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have a tag matching ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have a tag matching ${expectedStr}, but it didn't!`,
    expected: expectedTag,
    actual: gotTag,
  };
}
