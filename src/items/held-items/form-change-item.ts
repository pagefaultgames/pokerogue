import { HeldItemNames } from "#enums/held-item-id";
import { HeldItemBase } from "#items/held-item";
import i18next from "i18next";

export class FormChangeHeldItem extends HeldItemBase {
  get name(): string {
    return i18next.t(`modifierType:FormChangeItemId.${HeldItemNames[this.type]}`);
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.FormChangeItemModifierType.description");
  }

  get iconName(): string {
    return HeldItemNames[this.type].toLowerCase();
  }
}
