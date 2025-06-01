import { allHeldItems } from "#app/items/all-held-items";
import type { HeldItems } from "#app/enums/held-items";

interface HeldItemProperties {
  stack: number;
  disabled: boolean;
  cooldown?: number;
}

type HeldItemPropertyMap = {
  [key in HeldItems]: HeldItemProperties;
};

export class PokemonItemManager {
  public heldItems: HeldItemPropertyMap;

  constructor() {
    this.heldItems = {};
  }

  getHeldItemKeys(): number[] {
    return Object.keys(this.heldItems).map(k => Number(k));
  }

  hasItem(itemType: HeldItems): boolean {
    return itemType in this.heldItems;
  }

  getItem(itemType: HeldItems): HeldItemProperties {
    // TODO: Not very safe
    return this.heldItems[itemType];
  }

  getStack(itemType: HeldItems): number {
    return itemType in this.heldItems ? this.heldItems[itemType].stack : 0;
  }

  add(itemType: HeldItems, addStack = 1) {
    const maxStack = allHeldItems[itemType].getMaxStackCount();

    if (this.hasItem(itemType)) {
      // TODO: We may want an error message of some kind instead
      this.heldItems[itemType].stack = Math.min(this.heldItems[itemType].stack + addStack, maxStack);
    } else {
      this.heldItems[itemType] = { stack: Math.min(addStack, maxStack), disabled: false };
    }
  }

  remove(itemType: HeldItems, removeStack = 1) {
    this.heldItems[itemType].stack -= removeStack;

    if (this.heldItems[itemType].stack <= 0) {
      delete this.heldItems[itemType];
    }
  }
}
