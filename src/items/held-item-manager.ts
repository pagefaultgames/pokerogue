import { allHeldItems } from "#data/data-lists";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import {
  HeldItemCategoryId,
  type HeldItemId,
  isCategoryId,
  isItemInCategory,
  isItemInRequested,
} from "#enums/held-item-id";
import {
  type HeldItemConfiguration,
  type HeldItemDataMap,
  type HeldItemSaveData,
  type HeldItemSpecs,
  isHeldItemSpecs,
} from "#types/held-item-data-types";

/**
 * The `HeldItemManager` is a manager for a {@linkcode Pokemon}'s held items. \
 * It stores data about the items its associated `Pokemon` is holding,
 * with methods to query, retrieve and alter them as needed.
 */
export class HeldItemManager {
  // TODO: There should be a way of making these private...
  public heldItems: HeldItemDataMap = new Map();

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

  // TODO: This is never called with a restricted ID array ever
  // TODO: Would an array of `HeldItemSpecs` make more sense as a return value?
  // We're literally just bundling these into objects with counts of 1 apiece
  generateHeldItemConfiguration(restrictedIds?: HeldItemId[]): HeldItemConfiguration {
    const config: HeldItemConfiguration = [];
    for (const [id, item] of this.heldItems) {
      // TODO: `in` breaks with arrays
      if (!restrictedIds || restrictedIds.includes(id)) {
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

  // TODO: Condense these all into a single generic function that takes an arbitrary predicate,
  // and then export several pre-made predicates for use
  getHeldItems(): HeldItemId[] {
    return Array.from(this.heldItems.keys());
  }

  getTransferableHeldItems(): HeldItemId[] {
    return this.getHeldItems().filter(k => allHeldItems[k].isTransferable);
  }

  getStealableHeldItems(): HeldItemId[] {
    return this.getHeldItems().filter(k => allHeldItems[k].isStealable);
  }

  getSuppressableHeldItems(): HeldItemId[] {
    return this.getHeldItems().filter(k => allHeldItems[k].isSuppressable);
  }

  hasItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getHeldItems().some(id => isItemInCategory(id, itemType as HeldItemCategoryId));
    }
    return this.heldItems.has(itemType);
  }

  hasTransferableItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getHeldItems().some(
        id => isItemInCategory(id, itemType as HeldItemCategoryId) && allHeldItems[id].isTransferable,
      );
    }
    return this.heldItems.has(itemType as HeldItemId) && allHeldItems[itemType as HeldItemId].isTransferable;
  }

  // TODO: Consider renaming?
  getStack(itemType: HeldItemId): number {
    const item = this.heldItems.get(itemType);
    return item?.stack ?? 0;
  }

  // Use for tests if necessary to go over stack limit
  // TODO: Do we need this? We can just use overrides
  setStack(itemType: HeldItemId, stack: number): void {
    const item = this.heldItems.get(itemType);
    if (item) {
      item.stack = stack;
    }
  }

  isMaxStack(itemType: HeldItemId): boolean {
    const item = this.heldItems.get(itemType);
    return item ? item.stack >= allHeldItems[itemType].getMaxStackCount() : false;
  }

  add(itemType: HeldItemId | HeldItemSpecs, addStack = 1): boolean {
    if (isHeldItemSpecs(itemType)) {
      return this.addItemWithSpecs(itemType);
    }

    const maxStack = allHeldItems[itemType].getMaxStackCount();
    const item = this.heldItems.get(itemType);

    if (item) {
      // TODO: We may want an error message of some kind instead
      if (item.stack < maxStack) {
        item.stack = Math.min(item.stack + addStack, maxStack);
        return true;
      }
    } else {
      this.heldItems.set(itemType, { stack: Math.min(addStack, maxStack) });
      return true;
    }

    return false;
  }

  addItemWithSpecs(itemSpecs: HeldItemSpecs): boolean {
    const id = itemSpecs.id;
    const maxStack = allHeldItems[id].getMaxStackCount();
    const existing = this.heldItems.get(id);

    const tempStack = existing?.stack ?? 0;

    this.heldItems.set(id, {
      ...itemSpecs,
      stack: Math.min(itemSpecs.stack + tempStack, maxStack),
    });

    return true;
  }

  remove(itemType: HeldItemId, removeStack = 1, all = false) {
    const item = this.heldItems.get(itemType);

    if (item) {
      item.stack -= removeStack;

      if (all || item.stack <= 0) {
        this.heldItems.delete(itemType);
      }
    }
  }

  filterRequestedItems(requestedItems: (HeldItemCategoryId | HeldItemId)[], transferableOnly = true, exclude = false) {
    const currentItems = transferableOnly ? this.getTransferableHeldItems() : this.getHeldItems();

    return currentItems.filter(it => !exclude && isItemInRequested(it, requestedItems));
  }

  getHeldItemCount(): number {
    let total = 0;
    for (const specs of this.heldItems.values()) {
      total += specs?.stack ?? 0;
    }
    return total;
  }

  hasActiveFormChangeItem(id: FormChangeItemId): boolean {
    const item = this.heldItems.get(id);
    if (item) {
      return !!item.active;
    }
    return false;
  }

  getFormChangeItems(): FormChangeItemId[] {
    return this.filterRequestedItems(
      [HeldItemCategoryId.FORM_CHANGE, HeldItemCategoryId.RARE_FORM_CHANGE],
      false,
    ) as FormChangeItemId[];
  }

  toggleActive(id: FormChangeItemId) {
    const item = this.heldItems.get(id);
    if (item) {
      item.active = !item?.active;
    }
  }

  clearItems() {
    this.heldItems.clear();
  }
}
