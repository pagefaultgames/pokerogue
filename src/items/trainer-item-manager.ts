import { allTrainerItems } from "#app/items/all-trainer-items";
import type { TrainerItemId } from "#app/enums/trainer-item-id";
import {
  isTrainerItemSpecs,
  type TrainerItemConfiguration,
  type TrainerItemDataMap,
  type TrainerItemSpecs,
} from "#app/items/trainer-item-data-types";

export class TrainerItemManager {
  public trainerItems: TrainerItemDataMap;

  constructor() {
    this.trainerItems = {};
  }

  getItemSpecs(id: TrainerItemId): TrainerItemSpecs | undefined {
    const item = this.trainerItems[id];
    if (item) {
      const itemSpecs: TrainerItemSpecs = {
        ...item,
        id,
      };
      return itemSpecs;
    }
    return undefined;
  }

  generateTrainerItemConfiguration(restrictedIds?: TrainerItemId[]): TrainerItemConfiguration {
    const config: TrainerItemConfiguration = [];
    for (const [k, item] of Object.entries(this.trainerItems)) {
      const id = Number(k);
      if (item && (!restrictedIds || id in restrictedIds)) {
        const specs: TrainerItemSpecs = { ...item, id };
        config.push({ entry: specs, count: 1 });
      }
    }
    return config;
  }

  getTrainerItems(): number[] {
    return Object.keys(this.trainerItems).map(k => Number(k));
  }

  hasItem(itemType: TrainerItemId): boolean {
    return itemType in this.trainerItems;
  }

  getStack(itemType: TrainerItemId): number {
    const item = this.trainerItems[itemType];
    return item ? item.stack : 0;
  }

  isMaxStack(itemType: TrainerItemId): boolean {
    const item = this.trainerItems[itemType];
    return item ? item.stack >= allTrainerItems[itemType].getMaxStackCount() : false;
  }

  overrideItems(newItems: TrainerItemDataMap) {
    this.trainerItems = newItems;
    // The following is to allow randomly generated item configs to have stack 0
    for (const [item, properties] of Object.entries(this.trainerItems)) {
      if (!properties || properties.stack <= 0) {
        delete this.trainerItems[item];
      }
    }
  }

  add(itemType: TrainerItemId | TrainerItemSpecs, addStack = 1): boolean {
    if (isTrainerItemSpecs(itemType)) {
      return this.addItemWithSpecs(itemType);
    }

    const maxStack = allTrainerItems[itemType].getMaxStackCount();
    const item = this.trainerItems[itemType];

    if (item) {
      // TODO: We may want an error message of some kind instead
      if (item.stack < maxStack) {
        item.stack = Math.min(item.stack + addStack, maxStack);
        return true;
      }
    } else {
      this.trainerItems[itemType] = { stack: Math.min(addStack, maxStack) };
      return true;
    }
    return false;
  }

  addItemWithSpecs(itemSpecs: TrainerItemSpecs): boolean {
    const id = itemSpecs.id;
    const maxStack = allTrainerItems[id].getMaxStackCount();
    const item = this.trainerItems[id];

    const tempStack = item?.stack ?? 0;

    this.trainerItems[id] = itemSpecs;
    this.trainerItems[id].stack = Math.min(itemSpecs.stack + tempStack, maxStack);

    return true;
  }

  remove(itemType: TrainerItemId, removeStack = 1, all = false) {
    const item = this.trainerItems[itemType];

    if (item) {
      item.stack -= removeStack;

      if (all || item.stack <= 0) {
        delete this.trainerItems[itemType];
      }
    }
  }

  filterRequestedItems(requestedItems: TrainerItemId[], exclude = false) {
    const currentItems = this.getTrainerItems();
    return currentItems.filter(it => !exclude && requestedItems.some(entry => it === entry));
  }

  getTrainerItemCount(): number {
    let total = 0;
    for (const properties of Object.values(this.trainerItems)) {
      total += properties?.stack ?? 0;
    }
    return total;
  }

  lapseItems(): void {
    for (const [item, properties] of Object.entries(this.trainerItems)) {
      if (allTrainerItems[item].isLapsing && properties) {
        properties.stack -= 1;
      }
      if (!properties || properties.stack <= 0) {
        delete this.trainerItems[item];
      }
    }
  }

  clearItems() {
    this.trainerItems = {};
  }
}
