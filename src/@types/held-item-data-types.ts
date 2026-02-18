import { type HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";
import type { AllHeldItems } from "#items/all-held-items";
import type { CosmeticHeldItem } from "#items/held-item";
import type { InferKeys } from "#types/type-helpers";

export interface HeldItemData {
  /**
   * Number of items in the stack, can also be used to track cooldown
   */
  stack: number;
  /**
   * Whether this item is currently disabled.
   * @defaultValue `false`
   */
  disabled: boolean;
  /**
   * Whether a form change is active.
   * TODO: This is only temporary to make things work, form change rework should get rid of it.
   * @defaultValue `false`
   */
  active?: boolean;
}

export type HeldItemDataMap = Map<HeldItemId, HeldItemData>;

export interface HeldItemSpecs extends HeldItemData {
  id: HeldItemId;
}

// TODO: Move these getters with the rest of the item getters in a nice big file
export function isHeldItemSpecs(entry: unknown): entry is HeldItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  return (
    typeof (entry as HeldItemSpecs).id === "number"
    && typeof (entry as HeldItemSpecs).stack === "number"
    && (entry as HeldItemSpecs).id in HeldItemId
  );
}

export type HeldItemWeights = Partial<Record<HeldItemId, number>>;

// TODO: Inline this into the sole place it is used
export type HeldItemWeightFunc = (party: Pokemon[]) => number;

interface HeldItemCategoryEntry extends HeldItemData {
  id: HeldItemCategoryId;
  customWeights?: HeldItemWeights;
}

// TODO: These predicate functions should use `unknown` instead of `any`, and should be reviewed to
// avoid misclassifying types
export function isHeldItemCategoryEntry(entry: any): entry is HeldItemCategoryEntry {
  return entry?.id && isHeldItemCategoryEntry(entry.id) && "customWeights" in entry;
}

interface HeldItemPoolEntry {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
  weight: number | HeldItemWeightFunc;
}

export type HeldItemPool = HeldItemPoolEntry[];

export function isHeldItemPool(value: any): value is HeldItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}

export type HeldItemTieredPool = Partial<Record<RarityTier, HeldItemPool>>;

// TODO: Since this can contain a `HeldItemSpecs`, this has the potential to have 2 different "count" statistics
// (which is useless and redundant).
// Why this should be able to hold specs is dubious at best.
interface HeldItemConfigurationEntry {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
  /**
   * The number of items to obtain, either as a numeric count or a function returning one.
   * Must be an integer value!
   * @defaultValue `1`
   */
  count?: number | (() => number);
}

export type HeldItemConfiguration = HeldItemConfigurationEntry[];

export interface PokemonItemMap {
  item: HeldItemSpecs;
  pokemonId: number;
}

export type HeldItemSaveData = HeldItemSpecs[];

/** Union type of all `HeldItemId`s whose corresponding items cannot be applied. */
type CosmeticHeldItemId = InferKeys<AllHeldItems, CosmeticHeldItem>;

/** Union type of all `HeldItemId`s whose corresponding items can be applied. */
export type ApplicableHeldItemId = Exclude<keyof AllHeldItems, CosmeticHeldItemId>;

/**
 * Dummy, TypeScript-only type to ensure that {@linkcode HeldItemId} and {@linkcode HeldItemCategoryId}
 * have 0 overlap between allowed IDs.
 *
 * ⚠️ Does not actually exist at runtime, so it must not be used!
 */
declare const EnsureHeldItemIDsAreDisjointFromCategories: (HeldItemId & HeldItemCategoryEntry) & never;
