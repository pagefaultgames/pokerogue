import { allHeldItems } from "#data/data-lists";
import type { FormChangeItem } from "#enums/form-change-item";
import {
  type HeldItemCategoryId,
  type HeldItemId,
  isCategoryId,
  isItemInCategory,
  isItemInRequested,
} from "#enums/held-item-id";
import {
  type FormChangeItemPropertyMap,
  type FormChangeItemSpecs,
  type HeldItemConfiguration,
  type HeldItemDataMap,
  type HeldItemSaveData,
  type HeldItemSpecs,
  isHeldItemSpecs,
} from "#items/held-item-data-types";
import { getTypedEntries, getTypedKeys } from "#utils/common";

export class HeldItemManager {
  public heldItems: HeldItemDataMap;
  public formChangeItems: FormChangeItemPropertyMap;

  constructor() {
    this.heldItems = {};
    this.formChangeItems = {};
  }

  getItemSpecs(id: HeldItemId): HeldItemSpecs | undefined {
    const item = this.heldItems[id];
    if (item) {
      const itemSpecs: HeldItemSpecs = {
        ...item,
        id,
      };
      return itemSpecs;
    }
    return undefined;
  }

  generateHeldItemConfiguration(restrictedIds?: HeldItemId[]): HeldItemConfiguration {
    const config: HeldItemConfiguration = [];
    for (const [id, item] of getTypedEntries(this.heldItems)) {
      if (item && (!restrictedIds || id in restrictedIds)) {
        const specs: HeldItemSpecs = { ...item, id };
        config.push({ entry: specs, count: 1 });
      }
    }
    for (const [id, item] of getTypedEntries(this.formChangeItems)) {
      if (item) {
        const specs: FormChangeItemSpecs = { ...item, id };
        config.push({ entry: specs, count: 1 });
      }
    }
    return config;
  }

  generateSaveData(): HeldItemSaveData {
    const saveData: HeldItemSaveData = [];
    for (const [id, item] of getTypedEntries(this.heldItems)) {
      if (item) {
        const specs: HeldItemSpecs = { ...item, id };
        saveData.push(specs);
      }
    }
    for (const [id, item] of getTypedEntries(this.formChangeItems)) {
      if (item) {
        const specs: FormChangeItemSpecs = { ...item, id };
        saveData.push(specs);
      }
    }
    return saveData;
  }

  getHeldItems(): HeldItemId[] {
    return getTypedKeys(this.heldItems);
  }

  getTransferableHeldItems(): HeldItemId[] {
    return getTypedKeys(this.heldItems).filter(k => allHeldItems[k].isTransferable);
  }

  getStealableHeldItems(): HeldItemId[] {
    return getTypedKeys(this.heldItems).filter(k => allHeldItems[k].isStealable);
  }

  getSuppressableHeldItems(): HeldItemId[] {
    return getTypedKeys(this.heldItems).filter(k => allHeldItems[k].isSuppressable);
  }

  hasItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return getTypedKeys(this.heldItems).some(id => isItemInCategory(id, itemType as HeldItemCategoryId));
    }
    return itemType in this.heldItems;
  }

  hasTransferableItem(itemType: HeldItemId | HeldItemCategoryId): boolean {
    if (isCategoryId(itemType)) {
      return getTypedKeys(this.heldItems).some(
        id => isItemInCategory(id, itemType as HeldItemCategoryId) && allHeldItems[id].isTransferable,
      );
    }
    return itemType in this.heldItems && allHeldItems[itemType].isTransferable;
  }

  getStack(itemType: HeldItemId): number {
    const item = this.heldItems[itemType];
    return item ? item.stack : 0;
  }

  // Use for tests if necessary to go over stack limit
  setStack(itemType: HeldItemId, stack: number): void {
    const item = this.heldItems[itemType];
    if (item) {
      item.stack = stack;
    }
  }

  isMaxStack(itemType: HeldItemId): boolean {
    const item = this.heldItems[itemType];
    return item ? item.stack >= allHeldItems[itemType].getMaxStackCount() : false;
  }

  overrideItems(newItems: HeldItemDataMap) {
    this.heldItems = newItems;
    // The following is to allow randomly generated item configs to have stack 0
    for (const [item, properties] of getTypedEntries(this.heldItems)) {
      if (!properties || properties.stack <= 0) {
        delete this.heldItems[item];
      }
    }
  }

  add(itemType: HeldItemId | HeldItemSpecs, addStack = 1): boolean {
    if (isHeldItemSpecs(itemType)) {
      return this.addItemWithSpecs(itemType);
    }

    const maxStack = allHeldItems[itemType].getMaxStackCount();
    const item = this.heldItems[itemType];

    if (item) {
      // TODO: We may want an error message of some kind instead
      if (item.stack < maxStack) {
        item.stack = Math.min(item.stack + addStack, maxStack);
        return true;
      }
    } else {
      this.heldItems[itemType] = { stack: Math.min(addStack, maxStack) };
      return true;
    }
    return false;
  }

  addItemWithSpecs(itemSpecs: HeldItemSpecs): boolean {
    const id = itemSpecs.id;
    const maxStack = allHeldItems[id].getMaxStackCount();
    const item = this.heldItems[id];

    const tempStack = item?.stack ?? 0;

    this.heldItems[id] = itemSpecs;
    this.heldItems[id].stack = Math.min(itemSpecs.stack + tempStack, maxStack);

    return true;
  }

  remove(itemType: HeldItemId, removeStack = 1, all = false) {
    const item = this.heldItems[itemType];

    if (item) {
      item.stack -= removeStack;

      if (all || item.stack <= 0) {
        delete this.heldItems[itemType];
      }
    }
  }

  filterRequestedItems(requestedItems: (HeldItemCategoryId | HeldItemId)[], transferableOnly = true, exclude = false) {
    const currentItems = transferableOnly ? this.getTransferableHeldItems() : this.getHeldItems();
    return currentItems.filter(it => !exclude && isItemInRequested(it, requestedItems));
  }

  getHeldItemCount(): number {
    let total = 0;
    for (const properties of Object.values(this.heldItems)) {
      total += properties?.stack ?? 0;
    }
    return total;
  }

  addFormChangeItem(id: FormChangeItem) {
    if (!(id in this.formChangeItems)) {
      this.formChangeItems[id] = { active: false };
    }
  }

  addFormChangeItemWithSpecs(item: FormChangeItemSpecs) {
    if (!(item.id in this.formChangeItems)) {
      this.formChangeItems[item.id] = { active: item.active };
    }
  }

  hasFormChangeItem(id: FormChangeItem): boolean {
    return id in this.formChangeItems;
  }

  hasActiveFormChangeItem(id: FormChangeItem): boolean {
    const item = this.formChangeItems[id];
    if (item) {
      return item.active;
    }
    return false;
  }

  getFormChangeItems(): FormChangeItem[] {
    return getTypedKeys(this.formChangeItems).map(k => k);
  }

  getActiveFormChangeItems(): FormChangeItem[] {
    return this.getFormChangeItems().filter(m => this.formChangeItems[m]?.active);
  }

  toggleActive(id: FormChangeItem) {
    const item = this.formChangeItems[id];
    if (item) {
      item.active = !item.active;
    }
  }

  clearItems() {
    this.heldItems = {};
    this.formChangeItems = {};
  }
}
