import type { GeneratableHeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { AllHeldItems } from "#items/all-held-items";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemAttr } from "#items/held-item-attr";
import type { InferKeys } from "#types/type-helpers";
import type { NonEmptyTuple } from "type-fest";

// TODO: This file is less of a _data_ types file and more of an _everything_ types file;
// we should rename it to clarify that intent

export interface HeldItemData {
  /**
   * Number of items in the stack, can also be used to track cooldown
   */
  stack: number;
  /**
   * Whether this item is currently disabled.
   * @defaultValue `false`
   */
  disabled?: boolean;
  /**
   * Whether a form change is active.
   * TODO: This is only temporary to make things work, form change rework should get rid of it.
   * @defaultValue `false`
   */
  active?: boolean;
}

export type HeldItemDataMap = Map<HeldItemId, HeldItemData>;

/**
 * Specification of an existing held item.
 * Used for save data persistence and transferring existing items during evolution, etc.
 *
 * If the intent is to generate a new item, use {@linkcode HeldItemConfigurationEntry} instead.
 */
export interface HeldItemSpecs extends HeldItemData {
  id: HeldItemId;
}

export type HeldItemWeights<T extends HeldItemId = HeldItemId> = Partial<Record<T, number>>;

type HeldItemWeightFunc =
  /** @param pokemon - The `Pokemon` receiving the item */
  (pokemon: Pokemon) => number;

interface HeldItemPoolEntry {
  entry: HeldItemId | GeneratableHeldItemCategoryId;
  weight: number | HeldItemWeightFunc;
}

export type HeldItemPool = NonEmptyTuple<HeldItemPoolEntry>;

/**
 * Declarative instruction for generating/granting held items to a Pokemon.
 * Evaluated by `assignItemsFromConfiguration` to generate items of the provided ID/category/pool.
 *
 * If the intent is to transfer/save existing items rather than generating new ones,
 * use {@linkcode HeldItemSpecs} instead.
 */
export interface HeldItemConfigurationEntry {
  entry: HeldItemId | GeneratableHeldItemCategoryId | HeldItemPool;
  /**
   * The number of items to obtain - must be a positive integer!
   * @defaultValue `1`
   */
  count?: number;
}

/** An ordered list of {@linkcode HeldItemConfigurationEntry} generation instructions. */
export type HeldItemConfiguration = HeldItemConfigurationEntry[];

// TODO: If this is an internal type, we can (and should) just shove a reference to the pokemon inside instead of the ID
export interface PokemonItemMap {
  item: HeldItemSpecs;
  pokemonId: number;
}

export type HeldItemSaveData = HeldItemSpecs[];

/** Union type of all `HeldItemId`s whose corresponding items cannot be applied. */
type CosmeticHeldItemId = InferKeys<AllHeldItems, CosmeticHeldItem>;

/** Union type of all `HeldItemId`s whose corresponding items can be applied. */
export type ApplicableHeldItemId = Exclude<keyof AllHeldItems, CosmeticHeldItemId>;

/** Utility type to retrieve the effects of a given {@linkcode HeldItem} based on its ID. */
export type ExtractHeldItemEffect<T extends ApplicableHeldItemId> =
  AllHeldItems[T] extends HeldItem<infer Attr extends HeldItemAttr> ? Attr["effect"] : never;
