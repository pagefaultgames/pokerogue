import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemCategoryEntry, HeldItemSpecs } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";

// TODO: Move to another file

export function applyHeldItems<T extends HeldItemEffect>(effect: T, params: HeldItemEffectParamMap[T]) {
  const { pokemon } = params;
  for (const item of pokemon.heldItemManager.iterItems()) {
    const heldItem = allHeldItems[item];
    if ("effects" in heldItem && heldItem.effects.includes(effect) && heldItem.shouldApply(effect, params)) {
      heldItem.apply(effect, params);
    }
  }
}

export function isHeldItemSpecs(entry: any): entry is HeldItemSpecs {
  return typeof entry.id === "number" && "stack" in entry;
}

export function isHeldItemCategoryEntry(entry: any): entry is HeldItemCategoryEntry {
  return entry?.id && isHeldItemCategoryEntry(entry.id) && "customWeights" in entry;
}

export function isStealableHeldItem(id: number): boolean {
  return allHeldItems[id]?.isStealable ?? false;
}

export function isSuppressableHeldItem(id: number): boolean {
  return allHeldItems[id]?.isSuppressable ?? false;
}

export function isTransferableHeldItem(id: number): boolean {
  return allHeldItems[id]?.isTransferable ?? false;
}
