import type { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemNames } from "#enums/held-item-id";
import { CosmeticHeldItem } from "#items/held-item";
import i18next from "i18next";

export class FormChangeHeldItem extends CosmeticHeldItem {
  constructor(type: FormChangeItemId) {
    super(type, 1);
  }

  public override get description(): string {
    return i18next.t("item:formChange.description");
  }

  get iconName(): string {
    return HeldItemNames[this.id].toLowerCase();
  }
}
