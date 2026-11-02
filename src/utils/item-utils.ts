import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemCategoryId, type HeldItemId, HeldItemNames, ITEM_CATEGORY_MASK } from "#enums/held-item-id";
import { TrainerItemNames } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemConfiguration, HeldItemPool, HeldItemSpecs } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import type { TrainerItemPool, TrainerItemSpecs } from "#types/trainer-item-data-types";
import { ValueHolder } from "./value-holder";

// TODO: Move to another file
export function applyHeldItems<T extends HeldItemEffect>(effect: T, params: HeldItemEffectParamMap[T]) {
  const { pokemon } = params;

  for (const itemId of pokemon.heldItemManager.getItems()) {
    const heldItem = allHeldItems[itemId] as HeldItem | CosmeticHeldItem;
    if ("effects" in heldItem && heldItem.hasEffect(effect)) {
      // Suppressed items are not applied.
      if (heldItem.isSuppressable && areItemsSuppressed(pokemon)) {
        continue;
      }
      (heldItem satisfies HeldItem).apply(effect, params);
    }
  }
}

/**
 * Check whether held items of a given Pokemon should be suppressed
 * by Embargo or Magic Room.
 * @param pokemon The Pokemon to check
 */
export function areItemsSuppressed(pokemon: Pokemon): boolean {
  const itemsSuppressed = new ValueHolder(false);
  globalScene.arena.applyTags(ArenaTagType.MAGIC_ROOM, itemsSuppressed);
  const embargoTag = pokemon.getTag(BattlerTagType.EMBARGO);
  if (embargoTag) {
    embargoTag.apply(itemsSuppressed);
  }
  applyAbAttrs("SuppressHeldItemsAbAttr", { pokemon, itemsSuppressed });
  return itemsSuppressed.value;
}

export function isHeldItemSpecs(entry: unknown): entry is HeldItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  const specs = entry as HeldItemSpecs;

  return typeof specs.id === "number" && typeof specs.stack === "number" && HeldItemNames[specs.id] != null;
}

export function isHeldItemSpecsArray(items: HeldItemConfiguration | HeldItemSpecs[]): items is HeldItemSpecs[] {
  return items.every(isHeldItemSpecs);
}

export function isTrainerItemSpecs(entry: unknown): entry is TrainerItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  const specs = entry as TrainerItemSpecs;

  return typeof specs.id === "number" && typeof specs.stack === "number" && specs.id in TrainerItemNames;
}

export function isTrainerItemPool(value: any): value is TrainerItemPool {
  return Array.isArray(value) && value.length > 0 && value.every(entry => "entry" in entry && "weight" in entry);
}

/**
 * Check whether an item or category is covered by a list of requested items/categories.
 * An item ID matches if it appears in the list directly or if its category does.
 * Passing a category ID matches only if that category itself is requested.
 */
export function isItemInRequested(
  itemId: HeldItemId | HeldItemCategoryId,
  requestedItems: readonly (HeldItemCategoryId | HeldItemId)[],
): boolean {
  return requestedItems.some(entry => itemId === entry || (itemId & ITEM_CATEGORY_MASK) === entry);
}

/** Type guard to check if an entry is a HeldItemPool. */
export function isHeldItemPool(entry: unknown): entry is HeldItemPool {
  return Array.isArray(entry);
}

/**
 * Check whether a held item belongs to a category.
 * @param itemId - The {@linkcode HeldItemId} to check
 * @param category - The {@linkcode HeldItemCategoryId} to check against
 * @returns Whether `itemId` belongs to `category`
 */
export function isItemInCategory(itemId: HeldItemId, category: HeldItemCategoryId): boolean {
  return getHeldItemCategory(itemId) === category;
}

export function isCategoryId(id: number): id is HeldItemCategoryId {
  return Object.values<number>(HeldItemCategoryId).includes(id);
}

/**
 * Get the category a held item belongs to.
 * @param itemId - The {@linkcode HeldItemId} to check
 * @returns The {@linkcode HeldItemCategoryId} of the item
 */
export function getHeldItemCategory(itemId: HeldItemId): HeldItemCategoryId {
  return (itemId & ITEM_CATEGORY_MASK) as HeldItemCategoryId;
}
