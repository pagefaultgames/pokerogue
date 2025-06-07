import { allHeldItems } from "#app/items/all-held-items";
import type { HeldItemId } from "#app/enums/held-item-id";

interface HeldItemProperties {
  stack: number;
  disabled: boolean;
  cooldown?: number;
}

type HeldItemPropertyMap = {
  [key in HeldItemId]: HeldItemProperties;
};

export class PokemonItemManager {
  public heldItems: HeldItemPropertyMap;

  constructor() {
    this.heldItems = {};
  }

  getHeldItemKeys(): number[] {
    return Object.keys(this.heldItems).map(k => Number(k));
  }

  hasItem(itemType: HeldItemId): boolean {
    return itemType in this.heldItems;
  }

  getItem(itemType: HeldItemId): HeldItemProperties {
    // TODO: Not very safe
    return this.heldItems[itemType];
  }

  getStack(itemType: HeldItemId): number {
    return itemType in this.heldItems ? this.heldItems[itemType].stack : 0;
  }

  add(itemType: HeldItemId, addStack = 1) {
    const maxStack = allHeldItems[itemType].getMaxStackCount();

    if (this.hasItem(itemType)) {
      // TODO: We may want an error message of some kind instead
      this.heldItems[itemType].stack = Math.min(this.heldItems[itemType].stack + addStack, maxStack);
    } else {
      this.heldItems[itemType] = { stack: Math.min(addStack, maxStack), disabled: false };
    }
  }

  remove(itemType: HeldItemId, removeStack = 1) {
    this.heldItems[itemType].stack -= removeStack;

    if (this.heldItems[itemType].stack <= 0) {
      delete this.heldItems[itemType];
    }
  }
}
