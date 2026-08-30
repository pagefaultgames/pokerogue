import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";

// TODO: Move to another file

export function applyHeldItems<T extends HeldItemEffect>(effect: T, params: HeldItemEffectParamMap[T]) {
  const { pokemon } = params;
  for (const itemId of pokemon.heldItemManager.getItems()) {
    const heldItem = allHeldItems[itemId] as HeldItem | CosmeticHeldItem;
    if ("effects" in heldItem && heldItem.hasEffect(effect)) {
      (heldItem satisfies HeldItem).apply(effect, params);
    }
  }
}
