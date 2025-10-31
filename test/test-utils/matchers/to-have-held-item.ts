import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemCategoryId, HeldItemId, isCategoryId } from "#enums/held-item-id";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { Pokemon } from "#field/pokemon";
import type { PartialWith } from "#test/@types/test-helpers";
import { getOnelineDiffStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { HeldItemSpecs } from "#types/held-item-data-types";
import { enumValueToKey } from "#utils/enums";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

export type expectedHeldItemType = HeldItemId | HeldItemCategoryId | PartialWith<HeldItemSpecs, "id" | "stack">;

/**
 * Matcher that checks if a {@linkcode Pokemon} has the given held item.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedItem - A {@linkcode HeldItemId} or {@linkcode HeldItemCategoryId} to check, or a partially filled
 * {@linkcode HeldItemSpecs} containing the desired values
 * @returns Whether the matcher passed
 */
export function toHaveHeldItem(
  this: MatcherState,
  received: unknown,
  expectedItem: expectedHeldItemType,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);

  // If a category was requested OR we lack the item in question, show `an error message.
  if (typeof expectedItem === "number" || !received.heldItemManager.hasItem(expectedItem.id)) {
    expectedItem = typeof expectedItem === "number" ? expectedItem : expectedItem.id;

    const pass = received.heldItemManager.hasItem(expectedItem);

    const actualStr = stringifyEnumArray(HeldItemId, received.heldItemManager.getHeldItems(), toHexStr);
    const expectedStr = itemIdToString(expectedItem);

    return {
      pass,
      // "Expected Magikarp to have an item with category HeldItemCategory.BERRY (=0xADAD), but it didn't!"
      message: () =>
        pass
          ? `Expected ${pkmName} to NOT have an item with ${expectedStr}, but it did!`
          : `Expected ${pkmName} to have an item with ${expectedStr}, but it didn't!`,
      expected: expectedStr,
      actual: actualStr,
    };
  }

  // Check the properties of the requested held item
  const items = Object.values(received.heldItemManager["heldItems"]);
  const pass = items.some(d =>
    this.equals(d, expectedItem, [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality]),
  );

  // Convert item IDs in the diff into actual numbers
  const expectedReadable = {
    ...expectedItem,
    id: toHexStr(expectedItem.id),
  };
  const actualReadable = received.heldItemManager["getHeldItemEntries"]().map(([id, spec]) => ({
    ...spec,
    id: toHexStr(id),
  }));
  const expectedStr = getOnelineDiffStr.call(this, expectedReadable);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have an item matching ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have an item matching ${expectedStr}, but it didn't!`,
    expected: expectedReadable,
    actual: actualReadable,
  };
}

const PADDING = 4;

/**
 * Convert a number into a readable hexadecimal format.
 * @param num - The number to convert
 * @returns The hex string
 */
function toHexStr(num: number): string {
  return `0x${num.toString(16).padStart(PADDING, "0")}`;
}

function itemIdToString(id: HeldItemId | HeldItemCategoryId): string {
  if (isCategoryId(id)) {
    const catStr = enumValueToKey(HeldItemCategoryId, id);
    return `catgeory HeldItemCategory.${catStr} (=${toHexStr(id)})`;
  }
  const idStr = enumValueToKey(HeldItemId, id);
  return `ID HeldItemId.${idStr} (=${toHexStr(id)})`;
}
