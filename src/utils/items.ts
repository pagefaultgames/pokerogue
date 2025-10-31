import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";

// TODO: Move to another file

export function applyHeldItems<T extends HeldItemEffect>(effect: T, params: HeldItemEffectParamMap[T]) {
  const { pokemon } = params;
  for (const item of pokemon.heldItemManager.getHeldItems()) {
    const heldItem = allHeldItems[item];
    if ("effects" in heldItem && heldItem.effects.includes(effect) && heldItem.shouldApply(effect, params)) {
      heldItem.apply(effect, params);
    }
  }
}
