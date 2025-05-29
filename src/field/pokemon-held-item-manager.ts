import { allHeldItems } from "#app/modifier/all-held-items";
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
  private heldItems: HeldItemPropertyMap;

  constructor() {
    this.heldItems = {};
  }

  getHeldItems(): HeldItemPropertyMap {
    return this.heldItems;
  }

  hasItem(itemType: HeldItems): boolean {
    return itemType in this.getHeldItems();
  }

  getItem(itemType: HeldItems): HeldItemProperties {
    // TODO: Not very safe
    return this.heldItems[itemType];
  }

  addHeldItem(itemType: HeldItems, addStack = 1) {
    const maxStack = allHeldItems[itemType].getMaxStackCount();

    if (this.hasItem(itemType)) {
      // TODO: We may want an error message of some kind instead
      this.heldItems[itemType].stack = Math.min(this.heldItems[itemType].stack + addStack, maxStack);
    } else {
      this.heldItems[itemType] = { stack: Math.min(addStack, maxStack), disabled: false };
    }
  }
}
