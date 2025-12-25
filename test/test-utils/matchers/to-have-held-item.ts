import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemCategoryId, HeldItemId, isCategoryId, isItemInCategory } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { OneOther } from "#test/@types/test-helpers";
import { getEnumStr, getOnelineDiffStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import type { HeldItemSpecs } from "#types/held-item-data-types";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Options type for {@linkcode toHaveHeldItem}.
 */
export type expectedHeldItemType = OneOther<HeldItemSpecs, "id" | "stack">;

/**
 * Matcher that checks if a {@linkcode Pokemon} has the given held item.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param expectedItem - Either a {@linkcode HeldItemId} or {@linkcode HeldItemCategoryId} to check, or a partially filled
 * {@linkcode HeldItemSpecs} containing the desired values
 * @param count - The expected number of items to have been passed; unused if a `HeldItemSpecs` is passed
 * @returns Whether the matcher passed
 */
export function toHaveHeldItem(
  this: MatcherState,
  received: unknown,
  expectedItem: HeldItemId | HeldItemCategoryId | expectedHeldItemType,
  count = 1,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const pkmName = getPokemonNameWithAffix(received);

  const id = typeof expectedItem === "number" ? expectedItem : expectedItem.id;

  // fast track for lacking item at all
  if (!received.heldItemManager.hasItem(id)) {
    const actualStr = stringifyEnumArray(HeldItemId, received.heldItemManager.getHeldItems(), { base: 16 });
    const expectedStr = itemIdToString(id);

    return {
      pass: false,
      // "Expected Magikarp to have an item with category HeldItemCategory.BERRY (=0xADAD), but it didn't!"
      message: () => `Expected ${pkmName} to have an item with ${expectedStr}, but it didn't!`,
      expected: expectedStr,
      actual: actualStr,
    };
  }

  const items = received.heldItemManager.generateSaveData();
  const itemsReadable = items.map(specs => ({
    ...specs,
    id: getEnumStr(HeldItemId, specs.id),
  }));

  if (typeof expectedItem === "number") {
    const matchingItems = items.filter(data => itemMatches(data.id, id));
    const pass = matchingItems.length === count;

    const expectedStr = {
      id: itemIdToString(id),
      stack: count,
    };
    const amtStr = count === 1 ? "an item" : `${count} items`;

    return {
      pass,
      // "Expected Magikarp to have an item with category HeldItemCategory.BERRY (=0xADAD), but it didn't!"
      message: () =>
        pass
          ? `Expected ${pkmName} to NOT have ${amtStr} with ${expectedStr}, but it did!`
          : `Expected ${pkmName} to have ${amtStr} with ${expectedStr}, but got ${matchingItems.length} instead!`,
      expected: expectedStr,
      actual: itemsReadable,
    };
  }

  // Check the properties of the requested held item
  const pass = items.some(d =>
    this.equals(d, expectedItem, [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality]),
  );

  // Convert item IDs in the diff into readable strings instead of arbitrary numbers
  const expectedReadable = {
    ...expectedItem,
    id: itemIdToString(expectedItem.id, false),
  };
  const expectedStr = getOnelineDiffStr.call(this, expectedReadable);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${pkmName} to NOT have an item matching ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have an item matching ${expectedStr}, but it didn't!`,
    expected: expectedReadable,
    actual: itemsReadable,
  };
}

/**
 * Utility function to compare 2 item IDs or categories and report whether the two match.
 * @param id1 - The first id  or category
 * @param id2 - The second id or category
 * @returns Whether id1 matches id2
 */
function itemMatches(id1: HeldItemId | HeldItemCategoryId, id2: HeldItemId | HeldItemCategoryId): boolean {
  if (isCategoryId(id1) === isCategoryId(id2)) {
    return id1 === id2;
  }
  // TS doesn't recognize that id2 is narrowed here as well by the prior If statement...
  if (isCategoryId(id1)) {
    return isItemInCategory(id2 as HeldItemId, id1);
  }
  return isItemInCategory(id1, id2 as HeldItemCategoryId);
}

/**
 * Helper function to convert an arbitrary held item ID or category into a string.
 * @param id - The {@linkcode HeldItemId} or {@linkcode HeldItemCategoryId} to stringify
 * @param usePrefix - (Default `true`) Whether to include a corresponding prefix in the output
 * @returns The resulting string.
 */
function itemIdToString(id: HeldItemId | HeldItemCategoryId, usePrefix = true): string {
  const options = { base: 16, prefix: usePrefix ? undefined : isCategoryId(id) ? "category " : "ID " };
  return isCategoryId(id) ? getEnumStr(HeldItemCategoryId, id, options) : getEnumStr(HeldItemId, id, options);
}
