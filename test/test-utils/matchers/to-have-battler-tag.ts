/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { Pokemon } from "#field/pokemon";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { getPokemonNameWithAffix } from "#app/messages";
import { BattlerTagType } from "#enums/battler-tag-type";
import { getEnumStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if a {@linkcode Pokemon} has a specific {@linkcode BattlerTagType}.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedBattlerTagType - The {@linkcode BattlerTagType} to check for
 * @returns Whether the matcher passed
 */
export function toHaveBattlerTag(
  this: MatcherState,
  received: unknown,
  expectedBattlerTagType: BattlerTagType,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pass = !!received.getTag(expectedBattlerTagType);
  const pkmName = getPokemonNameWithAffix(received);
  // "the SEEDED BattlerTag (=1)"
  const expectedTagStr = getEnumStr(BattlerTagType, expectedBattlerTagType, { prefix: "the ", suffix: " BattlerTag" });
  const actualTagStr = stringifyEnumArray(
    BattlerTagType,
    received.summonData.tags.map(t => t.tagType),
  );

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have ${expectedTagStr}, but it did!`
        : `Expected ${pkmName} to have ${expectedTagStr}, but it did not!`,
    actual: actualTagStr,
    expected: getEnumStr(BattlerTagType, expectedBattlerTagType),
  };
}
