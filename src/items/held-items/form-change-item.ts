import { HeldItemNames } from "#enums/held-item-id";
import { CosmeticHeldItem } from "#items/held-item";

// TODO: All form change items have max stack counts of 1 - we should edit the constructor to not store it
export class FormChangeHeldItem extends CosmeticHeldItem {
  get iconName(): string {
    return HeldItemNames[this.type].toLowerCase();
  }
}
