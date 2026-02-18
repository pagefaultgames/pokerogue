import { allHeldItems } from "#data/data-lists";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import {
  HeldItemCategoryId,
  type HeldItemId,
  isCategoryId,
  isItemInCategory,
  isItemInRequested,
} from "#enums/held-item-id";
import { ItemManager } from "#items/item-manager";
import { type HeldItemData, type HeldItemSpecs, isHeldItemSpecs } from "#types/held-item-data-types";

/**
 * The `HeldItemManager` is a manager for a {@linkcode Pokemon}'s held items. \
 * It stores data about the items its associated `Pokemon` is holding,
 * with methods to query, retrieve and alter them as needed.
 */
export class HeldItemManager extends ItemManager<HeldItemId, HeldItemData, HeldItemSpecs> {
  // #region Abstract method implementations
  protected override getMaxStackCount(id: HeldItemId): number {
    return allHeldItems[id].getMaxStackCount();
  }

  protected override isSpecs(entry: unknown): entry is HeldItemSpecs {
    return isHeldItemSpecs(entry);
  }

  // #region HeldItem-specific methods

  // TODO: Condense these all into a single generic function that takes an arbitrary predicate,
  // and then export several pre-made predicates ready for use
  // TODO: These functions should return iterators rather than less efficient arrays
  // once `getItems` is changed to do the same
  public getTransferableHeldItems(): HeldItemId[] {
    return this.getItems().filter(k => allHeldItems[k].isTransferable);
  }

  public getStealableHeldItems(): HeldItemId[] {
    return this.getItems().filter(k => allHeldItems[k].isStealable);
  }

  public getSuppressableHeldItems(): HeldItemId[] {
    return this.getItems().filter(k => allHeldItems[k].isSuppressable);
  }

  public override hasItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getItems().some(id => isItemInCategory(id, itemType));
    }
    return super.hasItem(itemType);
  }

  public hasTransferableItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getItems().some(id => isItemInCategory(id, itemType) && allHeldItems[id].isTransferable);
    }
    return this.items.has(itemType) && allHeldItems[itemType].isTransferable;
  }

  // Use for tests if necessary to go over stack limit
  // TODO: Remove - this is solely used for grip claw, and any tests that require exceeding the stack limit can simply access the underlying map
  // (not that exceeding the stack limit should be a thing we test for anyways; a more appropriate approach would be stubbing out relevant functions)
  public setStack(itemType: HeldItemId, stack: number): void {
    const item = this.items.get(itemType);
    if (item) {
      item.stack = stack;
    }
  }

  public filterRequestedItems(
    requestedItems: (HeldItemCategoryId | HeldItemId)[],
    transferableOnly = true,
    exclude = false,
  ) {
    const currentItems = transferableOnly ? this.getTransferableHeldItems() : this.getItems();

    return currentItems.filter(it => !exclude && isItemInRequested(it, requestedItems));
  }

  public hasActiveFormChangeItem(id: FormChangeItemId): boolean {
    return !!this.items.get(id)?.active;
  }

  public getFormChangeItems(): FormChangeItemId[] {
    return this.filterRequestedItems(
      [HeldItemCategoryId.FORM_CHANGE, HeldItemCategoryId.RARE_FORM_CHANGE],
      false,
    ) as FormChangeItemId[];
  }

  public toggleActive(id: FormChangeItemId): void {
    const item = this.items.get(id);
    if (item) {
      item.active = !item.active;
    }
  }

  // #endregion
}
