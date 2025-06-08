import { allHeldItems } from "#app/items/all-held-items";
import type { HeldItemId } from "#app/enums/held-item-id";
import type { FormChangeItem } from "#app/data/pokemon-forms";

interface HeldItemProperties {
  stack: number;
  disabled: boolean;
  cooldown?: number;
}

type HeldItemPropertyMap = {
  [key in HeldItemId]: HeldItemProperties;
};

interface FormChangeItemProperties {
  active: boolean;
}

type FormChangeItemPropertyMap = {
  [key in FormChangeItem]: FormChangeItemProperties;
};

export class PokemonItemManager {
  public heldItems: HeldItemPropertyMap;
  public formChangeItems: FormChangeItemPropertyMap;

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

  addFormChangeItem(id: FormChangeItem) {
    if (!(id in this.formChangeItems)) {
      this.formChangeItems[id] = { active: false };
    }
  }

  hasFormChangeItem(id: FormChangeItem): boolean {
    return id in this.formChangeItems;
  }

  hasActiveFormChangeItem(id: FormChangeItem): boolean {
    return id in this.formChangeItems && this.formChangeItems[id].active;
  }

  getFormChangeItems(): FormChangeItem[] {
    return Object.keys(this.formChangeItems).map(k => Number(k));
  }

  getActiveFormChangeItems(): FormChangeItem[] {
    return this.getFormChangeItems().filter(m => this.formChangeItems[m].active);
  }

  toggleActive(id: FormChangeItem) {
    if (id in this.formChangeItems) {
      this.formChangeItems[id].active = !this.formChangeItems[id].active;
    }
  }
}
