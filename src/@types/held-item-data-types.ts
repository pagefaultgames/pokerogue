import type { GeneratableHeldItemCategoryId, HeldItemId, HeldItemIdInCategory } from "#enums/held-item-id";
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

/** A selection weight: either a fixed number or a {@linkcode HeldItemWeightFunc}. */
export type HeldItemWeight = number | HeldItemWeightFunc;

/**
 * Custom selection weights for a subset of items.
 * These are unresolved, so values can be numeric or {@linkcode HeldItemWeightFunc}s.
 */
export type HeldItemCustomWeights<T extends HeldItemId = HeldItemId> = Partial<Record<T, HeldItemWeight>>;

/**
 * Narrowed version of {@linkcode HeldItemCustomWeights} for ease of use.
 */
export type HeldItemResolvedWeights<T extends HeldItemId = HeldItemId> = Partial<Record<T, number>>;

// #region Entries, pools and configurations

/**
 * @param pokemon - The `Pokemon` receiving the item
 */
export type HeldItemWeightFunc = (pokemon: Pokemon) => number;

/** A list of items and/or categories to exclude from an entry's results. */
export type HeldItemExclusionList = readonly (HeldItemId | GeneratableHeldItemCategoryId)[];

// TODO I prefer this format over duplicating `count` on every "subtype", but it isn't necessary (and `AnyHeldItemRoll` is needed anyway)
/** Fields shared by every kind of roll. */
interface HeldItemRoll {
  /**
   * The specific entry for this roll. This should always be narrowed
   * rather than accessed from the base `HeldItemRoll` type. */
  entry: unknown;
  /**
   * The number of times to resolve the roll. When used with a
   * category/pool, `count` independent selections are made.
   *
   * Must be a positive integer!
   * @defaultValue `1`
   */
  count?: number;
}

/** An entry granting one specific item. */
interface HeldItemIdRoll extends HeldItemRoll {
  entry: HeldItemId;
  /** A specific item has nothing to weight. */
  customWeights?: never;
  /** A specific item has nothing to exclude. */
  exclude?: never;
}

/**
 * An entry rolling an item from a category.
 */
type HeldItemCategoryRoll = {
  [C in GeneratableHeldItemCategoryId]: HeldItemRoll & {
    entry: C;
    /**
     * Custom selection weights for items of this category, as numbers or functions of the receiving Pokemon.
     * Unlisted items keep their default weight.
     */
    customWeights?: HeldItemCustomWeights<HeldItemIdInCategory<C>>;
    /**
     * Items from this category that should never be rolled.
     * Shorthand for giving them a weight of `0`.
     *
     * @remarks
     * Prefer using weights of 0 over combining `weights` and `exclude`.
     * If they are mixed, excluded items take priority over alternative custom weights.
     */
    exclude?: readonly HeldItemIdInCategory<C>[];
  };
}[GeneratableHeldItemCategoryId];

/**
 * An entry picking from a {@linkcode HeldItemPool}.
 * @remarks
 * This is different from a {@linkcode HeldItemPoolEntry}, which is an entry *in* a {@linkcode HeldItemPool}.
 */
interface HeldItemPoolRoll extends HeldItemRoll {
  entry: HeldItemPool;
  /** Weight the pool's entries directly instead. */
  customWeights?: never;
  /**
   * Items and/or categories to remove from the pool. These are applied recursively,
   * so items excluded from a pool are excluded from all subpools as well.
   * @remarks
   * To avoid excessive type nonsense, this is not restricted to entries actually in the pool.
   * Exclusions of items not present in the pool are ignored.
   */
  exclude?: HeldItemExclusionList;
}

/**
 * Shared shape of {@linkcode HeldItemConfigurationEntry} and {@linkcode HeldItemPoolEntry}.
 */
export type AnyHeldItemRoll = HeldItemIdRoll | HeldItemCategoryRoll | HeldItemPoolRoll;

/**
 * A single unweighted entry of a {@linkcode HeldItemConfiguration}.
 *
 * @privateRemarks
 * `weight?: never` prevents a `HeldItemPool` from being accidentally passed as a `HeldItemConfiguration`
 * (where it would grant every item in the pool).
 */
export type HeldItemConfigurationEntry = AnyHeldItemRoll & { weight?: never };

/**
 * A single weighted entry of a {@linkcode HeldItemPool}.
 * Pool entries cannot contain nested pools (we may want to revisit this later).
 */
export type HeldItemPoolEntry = AnyHeldItemRoll & {
  weight: HeldItemWeight;
};

/** A weighted list of entries from which exactly one is picked per roll. */
export type HeldItemPool = NonEmptyTuple<HeldItemPoolEntry>;

/** A list of entries, all of which are granted. */
export type HeldItemConfiguration = NonEmptyTuple<HeldItemConfigurationEntry>;

// #endregion Entries, pools and configurations

export interface PokemonItemMap {
  item: HeldItemSpecs;
  pokemon: Pokemon;
}

/** Union type of all `HeldItemId`s whose corresponding items cannot be applied. */
type CosmeticHeldItemId = InferKeys<AllHeldItems, CosmeticHeldItem>;

/** Union type of all `HeldItemId`s whose corresponding items can be applied. */
export type ApplicableHeldItemId = Exclude<keyof AllHeldItems, CosmeticHeldItemId>;

/** Utility type to retrieve the effects of a given {@linkcode HeldItem} based on its ID. */
export type ExtractHeldItemEffect<T extends ApplicableHeldItemId> =
  AllHeldItems[T] extends HeldItem<infer Attr extends HeldItemAttr> ? Attr["effect"] : never;
