import { allHeldItems } from "#data/data-lists";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import {
  HeldItemCategoryId,
  type HeldItemId,
  isCategoryId,
  isItemInCategory,
  isItemInRequested,
} from "#enums/held-item-id";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import { ItemManager } from "#items/item-manager";
import type { HeldItemData, HeldItemSpecs } from "#types/held-item-data-types";
import { isHeldItemSpecs } from "#utils/item-utils";
import { clampInt } from "@material/material-color-utilities";

/**
 * The `HeldItemManager` is a manager for a {@linkcode Pokemon}'s held items. \
 * It stores data about the items its associated `Pokemon` is holding,
 * with methods to query, retrieve and alter them as needed.
 */
export class HeldItemManager extends ItemManager<HeldItemId, HeldItemData> {
  // #region Abstract method implementations
  protected override getMaxStackCount(id: HeldItemId): number {
    return (allHeldItems[id] satisfies HeldItem | CosmeticHeldItem).maxStackCount;
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

  /**
   * Returns the stack size of the requested {@linkcode HeldItemId}.
   * This also includes the temporary stack, unless explicitly requested.
   * @param itemType - The item to get the stack for
   * @param excludeTempStack - Whether the temporary stack should be excluded.
   */
  public override getStack(itemType: HeldItemId, excludeTempStack = false): number {
    const item = this.items.get(itemType);
    if (!item) {
      return 0;
    }
    if (excludeTempStack) {
      return item.stack;
    }
    return item.stack + (item.tempStack ?? 0);
  }

  public override isMaxStack(itemType: HeldItemId, excludeTempStack = false): boolean {
    const stack = this.getStack(itemType, excludeTempStack);
    return stack >= this.getMaxStackCount(itemType);
  }

  public override hasItem(itemType: HeldItemId | HeldItemCategoryId, excludeTempStack = false): boolean {
    if (isCategoryId(itemType)) {
      return this.getItems().some(id => isItemInCategory(id, itemType) && this.getStack(id, excludeTempStack) > 0);
    }
    return this.getStack(itemType, excludeTempStack) > 0;
  }

  /**
   * Returns all {@linkcode HeldItemId} currently held by the Pokémon.
   * By default, items for which the stack size is temporarily 0 are not included.
   * @param excludeTempStack - Whether the temporary stack should be excluded.
   */
  public override getItems(excludeTempStack = false): HeldItemId[] {
    if (excludeTempStack) {
      return super.getItems();
    }
    return super.getItems().filter(k => this.getStack(k) > 0);
  }

  // TODO: ensure that clamping happend correctly when using this.add
  /**
   * Adds to the temporary stack for the given {@linkcode HeldItemId}.
   * If the sum of stack + tempStack would exceed the limits (less than 0
   * or more than the maximum stack size), the amount added is clamped.
   * @param itemType - The item to add.
   * @param qty - How much to increase the stack.
   */
  public addTempStack(itemType: HeldItemId, qty: number): boolean {
    if (!this.hasItem(itemType)) {
      this.add(itemType, 0);
    }
    const stack = this.getStack(itemType);
    const permanentStack = this.getStack(itemType, false);
    const newStack = clampInt(0, this.getMaxStackCount(itemType), stack + qty);
    const item = this.items.get(itemType);
    if (!item) {
      return false;
    }
    item.tempStack = newStack - permanentStack;
    return true;
  }

  public hasTransferableItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return this.getItems().some(id => isItemInCategory(id, itemType) && allHeldItems[id].isTransferable);
    }
    return this.items.has(itemType) && allHeldItems[itemType].isTransferable;
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
