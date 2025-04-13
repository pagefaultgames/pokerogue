import { allHeldItems } from "#app/modifier/held-items";
import type { HeldItemType } from "#app/modifier/held-items";

export class PokemonItemManager {
  private heldItems: [HeldItemType, number][];

  constructor() {
    this.heldItems = [];
  }

  getHeldItems(): [HeldItemType, number][] {
    return this.heldItems;
  }

  addHeldItem(itemType: HeldItemType, stack: number) {
    const maxStack = allHeldItems[itemType].getMaxStackCount();

    const existing = this.heldItems.find(([type]) => type === itemType);

    if (existing) {
      existing[1] = Math.min(existing[1] + stack, maxStack);
    } else {
      this.heldItems.push([itemType, Math.min(stack, maxStack)]);
    }
  }
}
