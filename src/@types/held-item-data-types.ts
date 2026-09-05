import type { GeneratableHeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { AllHeldItems } from "#items/all-held-items";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemAttr } from "#items/held-item-attr";
import type { InferKeys } from "#types/type-helpers";
import type { NonEmptyTuple } from "type-fest";

// TODO: This file is less of a _data_ types file and more of an _everything_ types file;
// we should rename it to clarify that intent

/**
 * Runtime data for a particular held item.
 */
export interface HeldItemData {
  /**
   * Number of items in the stack, can also be used to track cooldown
   */
  stack: number;
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

/**
 * A mapping of held item IDs to numeric weights for weighted random selection.
 * Used to customize selection odds within item categories.
 */
export type HeldItemWeights<T extends HeldItemId = HeldItemId> = Partial<Record<T, number>>;

/**
 * Calculate the selection weight of an entry in a {@linkcode HeldItemPool}.
 * @param pokemon - The `Pokemon` receiving the item
 * @returns The numeric weight for the item pool entry
 */
type HeldItemPoolWeightFunc = (pokemon: Pokemon) => number;

/**
 * A selectable entry in a held item pool.
 * @see `getNewHeldItemFromPool` (held-item-pool.ts)
 *
 * @privateRemarks
 * It is feasible in the future to be more permissive about the types
 * allowed here in `entry` (nested pools, etc.). Doing so is not needed
 * in the base system and requires care to be taken in the full pipeline
 * to ensure the additional/recursive cases are handled.
 */
interface HeldItemPoolEntry {
  entry: HeldItemId | GeneratableHeldItemCategoryId;
  weight: number | HeldItemPoolWeightFunc;
}

/** A non-empty tuple of {@linkcode HeldItemPoolEntry} */
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

export interface PokemonItemMap {
  item: HeldItemSpecs;
  pokemon: Pokemon;
}

/** Alias for an array of {@linkcode HeldItemSpecs} */
export type HeldItemSaveData = HeldItemSpecs[];

/** Union type of all `HeldItemId`s whose corresponding items cannot be applied. */
type CosmeticHeldItemId = InferKeys<AllHeldItems, CosmeticHeldItem>;

/** Union type of all `HeldItemId`s whose corresponding items can be applied. */
export type ApplicableHeldItemId = Exclude<keyof AllHeldItems, CosmeticHeldItemId>;

/** Utility type to retrieve the effects of a given {@linkcode HeldItem} based on its ID. */
export type ExtractHeldItemEffect<T extends ApplicableHeldItemId> =
  AllHeldItems[T] extends HeldItem<infer Attr extends HeldItemAttr> ? Attr["effect"] : never;
