import { allHeldItems } from "#app/items/all-held-items";
import { isItemInCategory, isItemInRequested, type HeldItemCategoryId, type HeldItemId } from "#app/enums/held-item-id";
import type { FormChangeItem } from "#enums/form-change-item";
import {
  type HeldItemConfiguration,
  isHeldItemSpecs,
  type HeldItemDataMap,
  type HeldItemSpecs,
  type FormChangeItemPropertyMap,
  type FormChangeItemSpecs,
  type HeldItemSaveData,
} from "#app/items/held-item-data-types";

export class PokemonItemManager {
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
    for (const [k, item] of Object.entries(this.heldItems)) {
      const id = Number(k);
      if (item && (!restrictedIds || id in restrictedIds)) {
        const specs: HeldItemSpecs = { ...item, id };
        config.push({ entry: specs, count: 1 });
      }
    }
    for (const [k, item] of Object.entries(this.formChangeItems)) {
      const id = Number(k);
      const specs: FormChangeItemSpecs = { ...item, id };
      config.push({ entry: specs, count: 1 });
    }
    return config;
  }

  generateSaveData(): HeldItemSaveData {
    const saveData: HeldItemSaveData = [];
    for (const [k, item] of Object.entries(this.heldItems)) {
      const id = Number(k);
      if (item) {
        const specs: HeldItemSpecs = { ...item, id };
        saveData.push(specs);
      }
    }
    for (const [k, item] of Object.entries(this.formChangeItems)) {
      const id = Number(k);
      const specs: FormChangeItemSpecs = { ...item, id };
      saveData.push(specs);
    }
    return saveData;
  }

  getHeldItems(): number[] {
    return Object.keys(this.heldItems).map(k => Number(k));
  }

  getTransferableHeldItems(): number[] {
    return Object.keys(this.heldItems)
      .filter(k => allHeldItems[k].isTransferable)
      .map(k => Number(k));
  }

  getStealableHeldItems(): number[] {
    return Object.keys(this.heldItems)
      .filter(k => allHeldItems[k].isStealable)
      .map(k => Number(k));
  }

  getSuppressableHeldItems(): number[] {
    return Object.keys(this.heldItems)
      .filter(k => allHeldItems[k].isSuppressable)
      .map(k => Number(k));
  }

  hasItem(itemType: HeldItemId): boolean {
    return itemType in this.heldItems;
  }

  hasItemCategory(categoryId: HeldItemCategoryId): boolean {
    return Object.keys(this.heldItems).some(id => isItemInCategory(Number(id), categoryId));
  }

  getStack(itemType: HeldItemId): number {
    const item = this.heldItems[itemType];
    return item ? item.stack : 0;
  }

  isMaxStack(itemType: HeldItemId): boolean {
    const item = this.heldItems[itemType];
    return item ? item.stack >= allHeldItems[itemType].getMaxStackCount() : false;
  }

  overrideItems(newItems: HeldItemDataMap) {
    this.heldItems = newItems;
    // The following is to allow randomly generated item configs to have stack 0
    for (const [item, properties] of Object.entries(this.heldItems)) {
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
    return Object.keys(this.formChangeItems).map(k => Number(k));
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
