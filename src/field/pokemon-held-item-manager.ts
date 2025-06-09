import { allHeldItems } from "#app/items/all-held-items";
import type { HeldItemId } from "#app/enums/held-item-id";
import type { FormChangeItem } from "#app/data/pokemon-forms";
import type { BASE_STAT_TOTAL_DATA } from "#app/items/held-items/base-stat-total";
import type { BASE_STAT_FLAT_DATA } from "#app/items/held-items/base-stat-flat";

type HELD_ITEM_DATA = BASE_STAT_TOTAL_DATA | BASE_STAT_FLAT_DATA;

interface HeldItemProperties {
  stack: number;
  disabled: boolean;
  cooldown?: number;
  data?: HELD_ITEM_DATA;
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

  getItem(itemType: HeldItemId): HeldItemProperties {
    // TODO: Not very safe
    return this.heldItems[itemType];
  }

  getStack(itemType: HeldItemId): number {
    return itemType in this.heldItems ? this.heldItems[itemType].stack : 0;
  }

  add(itemType: HeldItemId, addStack = 1, data?: HELD_ITEM_DATA) {
    const maxStack = allHeldItems[itemType].getMaxStackCount();

    if (this.hasItem(itemType)) {
      // TODO: We may want an error message of some kind instead
      this.heldItems[itemType].stack = Math.min(this.heldItems[itemType].stack + addStack, maxStack);
    } else {
      this.heldItems[itemType] = { stack: Math.min(addStack, maxStack), disabled: false, data: data };
    }
  }

  remove(itemType: HeldItemId, removeStack = 1, all = false) {
    this.heldItems[itemType].stack -= removeStack;

    if (all || this.heldItems[itemType].stack <= 0) {
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
