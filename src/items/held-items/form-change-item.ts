import { HeldItemNames } from "#enums/held-item-id";
import { CosmeticHeldItem } from "#items/held-item";
import i18next from "i18next";

// TODO: All form change items have max stack counts of 1 - we should edit the constructor to not store it
export class FormChangeHeldItem extends CosmeticHeldItem {
  public override get description(): string {
    return i18next.t("item:formChange.description");
  }

  get iconName(): string {
    return HeldItemNames[this.id].toLowerCase();
  }
}
