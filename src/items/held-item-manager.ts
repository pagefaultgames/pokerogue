/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { allHeldItems } from "#data/data-lists";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import {
  getHeldItemCategory,
  isBerry,
  isCategoryId,
  isFormChangeItem,
  isItemInCategory,
  isItemInRequested,
} from "#enums/held-item-id";
import type {
  HeldItemConfiguration,
  HeldItemData,
  HeldItemDataMap,
  HeldItemSaveData,
  HeldItemSpecs,
} from "#types/held-item-data-types";
import { isHeldItemSpecs, isStealableHeldItem, isSuppressableHeldItem } from "#utils/items";

export class HeldItemManager {
  // TODO: There should be a way of making these private...
  protected heldItems: HeldItemDataMap = new Map();

  public getItemData(id: HeldItemId): Readonly<HeldItemData> | undefined {
    return this.heldItems.get(id);
  }

  getItemSpecs(id: HeldItemId): HeldItemSpecs | undefined {
    const item = this.heldItems.get(id);
    if (!item) {
      return;
    }
    return {
      ...item,
      id,
    } as HeldItemSpecs;
  }

  generateHeldItemConfiguration(restrictedIds?: HeldItemId[]): HeldItemConfiguration {
    const config: HeldItemConfiguration = [];
    for (const [id, item] of this.heldItems) {
      // TODO: `in` breaks with arrays
      if (item && (!restrictedIds || id in restrictedIds)) {
        const specs: HeldItemSpecs = { ...item, id };
        config.push({ entry: specs, count: 1 });
      }
    }
    return config;
  }

  generateSaveData(): HeldItemSaveData {
    const saveData: HeldItemSaveData = [];
    for (const [id, item] of this.heldItems) {
      // TODO: Is this check needed?
      if (item) {
        const specs: HeldItemSpecs = { ...item, id };
        saveData.push(specs);
      }
    }
    return saveData;
  }

  /**
   * Iterate over the the held item IDs in this manager
   * @returns An iterator of `[HeldItemId, HeldItemData]` tuples
   */
  [Symbol.iterator](): IteratorObject<[HeldItemId, HeldItemData], undefined, unknown> {
    return this.heldItems[Symbol.iterator]();
  }

  /**
   * Iterate over the held item IDs in this manager
   *
   * @remarks
   * ⚠️ As an iterator, modifying the items in the manager during iteration
   * will cause this method to also iterate over the newly added items.
   * If this is not the desired behavior, consider using {@linkcode getHeldItems},
   * which returns a fresh array of the held item IDs currently in the manager.
   */
  public iterItems(): IteratorObject<HeldItemId, undefined, unknown> {
    return this.heldItems.keys();
  }

  /**
   * Get an array of held items in the manager
   * @remarks
   * This will return a fresh array of the items currently in the manager.
   * Consider using {@linkcode iterItems} if you just need to iterate over them.
   * @returns - A fresh array of the held items in the manager
   */
  public getHeldItems(): HeldItemId[] {
    return this.heldItems.keys().toArray();
  }

  /**
   * Iterate over the held items in this manager that are berries.
   * @returns An iterator of {@linkcode HeldItemId}s that are berries
   */
  public iterBerries(): IteratorObject<HeldItemId, undefined, unknown> {
    return this.iterItems().filter(isBerry);
  }

  /**
   * Iterate over the held items in this manager that are transferable.
   *
   * @remarks
   * ⚠️ As an iterator, modifying the items in the manager during iteration
   * will cause this method to also iterate over the newly added items.
   * If this is not the desired behavior, consider using {@linkcode getTransferableHeldItems},
   * which returns a fresh array of the transferable held item IDs currently in the manager.
   *
   * @returns An iterator of {@linkcode HeldItemId}s that are transferable
   */
  public iterTransferableItems(): IteratorObject<HeldItemId, undefined, unknown> {
    return this.heldItems.keys().filter(k => allHeldItems[k].isTransferable);
  }

  /**
   * Get an array of the held items that are transferable.
   * @remarks
   * This will return a fresh array of the transferable items currently in the manager.
   * Consider using {@linkcode iterTransferableItems} if you just need to iterate over them.
   * @returns A fresh array of {@linkcode HeldItemId}s that are transferable
   */
  public getTransferableHeldItems(): HeldItemId[] {
    return this.heldItems
      .keys()
      .filter(k => allHeldItems[k].isTransferable)
      .toArray();
  }

  /**
   * @returns Whether this contains any stealable held items
   */
  public hasStealableHeldItems(): boolean {
    return this.iterItems().some(isStealableHeldItem);
  }

  /**
   * @returns A fresh array of the stealable held items
   */
  public getStealableHeldItems(): HeldItemId[] {
    return this.iterItems().filter(isStealableHeldItem).toArray();
  }

  /**
   * @returns A fresh array of the suppressable held items
   */
  public getSuppressableHeldItems(): HeldItemId[] {
    return this.iterItems().filter(isSuppressableHeldItem).toArray();
  }

  /**
   * Check whether the manager has a specific held item or any item in a specific category
   * @param itemType - The held item ID or category ID to check for
   * @returns Whether the manager has the specified held item or any item in the specified category
   */
  public hasItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.iterItems().some(id => isItemInCategory(id, itemType as HeldItemCategoryId));
    }
    return this.heldItems.has(itemType);
  }

  /**
   * Group held items by their category
   * @returns A mapping of held item categories to arrays of held item IDs in that category
   */
  public getByCategory(): Partial<Record<HeldItemCategoryId, HeldItemId[]>> {
    return Object.groupBy(this.iterItems(), getHeldItemCategory);
  }

  public hasTransferableItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getHeldItems().some(
        id => isItemInCategory(id, itemType as HeldItemCategoryId) && allHeldItems[id].isTransferable,
      );
    }
    return this.heldItems.has(itemType as HeldItemId) && allHeldItems[itemType as HeldItemId].isTransferable;
  }

  /**
   * Get the amount of a specific held item in the manager
   * @param itemType - The held item ID to check
   * @returns The amount of the specified held item in the manager (0 if not present)
   */
  public getAmount(itemType: HeldItemId): number {
    return this.heldItems.get(itemType)?.stack ?? 0;
  }

  // Use for tests if necessary to go over stack limit
  // TODO: Do we need this? We can just use overrides
  public setStack(itemType: HeldItemId, stack: number): void {
    const item = this.heldItems.get(itemType);
    if (item) {
      item.stack = stack;
    }
  }

  /**
   * Check whether the the held item is at its max stack count
   * @param itemType - The held item ID to check
   * @returns Whether the held item is at its max stack count
   */
  public isMaxStack(itemType: HeldItemId): boolean {
    const stack = this.heldItems.get(itemType)?.stack;
    return stack != null && stack >= allHeldItems[itemType].getMaxStackCount();
  }

  /**
   * Increase the stack count of a held item, adding it if it doesn't exist
   * @param itemType - The item to add, or a specification
   * @param amount - (default `1`) The number of items to add to the stack. Ignored if `itemType` is a spec
   * @returns Whether new items were added. If the item is a spec, this is always `true`.
   */
  public add(itemType: HeldItemId | HeldItemSpecs, amount = 1): boolean {
    if (isHeldItemSpecs(itemType)) {
      this.addItemWithSpecs(itemType);
      return true;
    }

    const maxStack = allHeldItems[itemType].getMaxStackCount();
    const item = this.heldItems.get(itemType);

    if (item == null) {
      this.heldItems.set(itemType, { stack: Math.min(amount, maxStack) });
      return true;
    }

    if (item.stack < maxStack) {
      item.stack = Math.min(item.stack + amount, maxStack);
      return true;
    }

    return false;
  }

  /**
   * Add an item to the map from a specification
   *
   * @remarks
   * If the item already exists in the manager, its stack will be increased,
   * but its specs will be overridden with the new specs.
   *
   * @param itemSpecs - The full specifications of the held item to add
   */
  public addItemWithSpecs(itemSpecs: HeldItemSpecs): void {
    const id = itemSpecs.id;
    const maxStack = allHeldItems[id].getMaxStackCount();
    const existing = this.heldItems.get(id);

    const tempStack = existing?.stack ?? 0;

    this.heldItems.set(id, {
      ...itemSpecs,
      stack: Math.min(itemSpecs.stack + tempStack, maxStack),
    });
  }

  /**
   * Remove a held item or reduce its stack count
   *
   * @param itemType - The held item ID to remove
   * @param removeStack - (default `1`) The number of items to remove from the stack. If -1, will remove the entire stack
   * @returns `true` if the item existed and was removed or had its stack reduced, `false` otherwise
   */
  public remove(itemType: HeldItemId, removeStack = 1): boolean {
    const items = this.heldItems;
    if (removeStack === -1) {
      return items.delete(itemType);
    }
    const item = items.get(itemType);
    if (item == null) {
      return false;
    }
    item.stack -= removeStack;
    if (item.stack <= 0) {
      items.delete(itemType);
    }
    return true;
  }

  /**
   * Filter held items by a list of requested items or categories
   * @param requestedItems - A list of items or item IDs to request
   * @param transferableOnly - (default `true`) Whether to only include transferable items
   * @param exclude - (default `false`) Whether the filter is inclusive or exclusive
   * @returns An array of held item IDs that match the requested items
   */
  public filterRequestedItems(
    requestedItems: (HeldItemCategoryId | HeldItemId)[],
    transferableOnly = true,
    exclude = false,
  ): HeldItemId[] {
    const currentItems = transferableOnly ? this.iterTransferableItems() : this.iterItems();

    return currentItems.filter(it => !exclude && isItemInRequested(it, requestedItems)).toArray();
  }

  /**
   * @returns The total count of all held items in the manager
   */
  public getHeldItemCount(): number {
    return this.heldItems.values().reduce((count, item) => count + (item?.stack ?? 0), 0);
  }

  /**
   * Check whether the manager contains the specified form change item in an active state
   * @param id - The form change item ID to check
   * @returns Whether the form change item is present and active
   */
  public hasActiveFormChangeItem(id: FormChangeItemId): boolean {
    return !!this.heldItems.get(id)?.active;
  }

  /**
   * @returns An array of active form change items in this manager
   */
  public getActiveFormChangeItems(): FormChangeItemId[] {
    const items: FormChangeItemId[] = [];
    for (const [id, item] of this) {
      if (isFormChangeItem(id) && item.active) {
        items.push(id);
      }
    }

    return items;
  }

  public getFormChangeItems(): FormChangeItemId[] {
    return this.heldItems.keys().filter(isFormChangeItem).toArray();
  }

  /**
   * Toggle the active state of a form change item
   * @param id - The form change item ID to toggle
   */
  public toggleActive(id: FormChangeItemId): void {
    const item = this.heldItems.get(id);
    if (item) {
      item.active = !item?.active;
    }
  }

  /**
   * Remove all held items from the manager
   */
  public clearItems(): void {
    this.heldItems.clear();
  }
}
