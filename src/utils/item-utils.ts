import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemNames } from "#enums/held-item-id";
import { TrainerItemNames } from "#enums/trainer-item-id";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemCategoryEntry, HeldItemPool, HeldItemSpecs } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import type { TrainerItemPool, TrainerItemSpecs } from "#types/trainer-item-data-types";

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

export function isHeldItemSpecs(entry: unknown): entry is HeldItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  const specs = entry as HeldItemSpecs;

  return typeof specs.id === "number" && typeof specs.stack === "number" && specs.id in HeldItemNames;
}

// TODO: These predicate functions should use `unknown` instead of `any`,
// and should be reviewed to avoid misclassifying types

export function isHeldItemCategoryEntry(entry: any): entry is HeldItemCategoryEntry {
  return entry?.id && isHeldItemCategoryEntry(entry.id) && "customWeights" in entry;
}

export function isHeldItemPool(value: any): value is HeldItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}

export function isTrainerItemSpecs(entry: unknown): entry is TrainerItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  const specs = entry as TrainerItemSpecs;

  return typeof specs.id === "number" && typeof specs.stack === "number" && specs.id in TrainerItemNames;
}

export function isTrainerItemPool(value: any): value is TrainerItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}
