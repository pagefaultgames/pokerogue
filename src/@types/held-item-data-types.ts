import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";
import type { AllHeldItems } from "#items/all-held-items";
import type { CosmeticHeldItem } from "#items/held-item";
import type { InferKeys } from "#types/helpers/type-helpers";

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

export interface HeldItemSpecs extends HeldItemData {
  id: HeldItemId;
}

// TODO: Move these getters with the rest of the item getters in a nice big file
export function isHeldItemSpecs(entry: any): entry is HeldItemSpecs {
  return typeof entry.id === "number" && "stack" in entry;
}

export type HeldItemWeights = Partial<Record<HeldItemId, number>>;

export type HeldItemWeightFunc = (party: Pokemon[]) => number;

interface HeldItemCategoryEntry extends HeldItemData {
  id: HeldItemCategoryId;
  customWeights?: HeldItemWeights;
}

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

interface HeldItemConfigurationEntry {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
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
