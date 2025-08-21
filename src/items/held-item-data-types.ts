// TODO: move all types to `src/@types/` and all functions to a utility place
import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";

export type HeldItemData = {
  /**
   * Number of items in the stack, can also be used to track cooldown
   */
  stack: number;
  /**
   * Whether this item is currently disabled.
   * @defaultValue `false`
   */
  disabled?: boolean;
};

type FormChangeItemData = HeldItemData & {
  /**
   * Whether a form change is active.
   * TODO: This is only temporary to make things work, form change rework should get rid of it.
   * @defaultValue `false`
   */
  active?: boolean;
};

export type HeldItemDataMap = {
  [key in HeldItemId]?: key extends FormChangeItemData ? FormChangeItemData : HeldItemData;
};

export type HeldItemSpecs = HeldItemData & {
  id: HeldItemId;
};

export function isHeldItemSpecs(entry: any): entry is HeldItemSpecs {
  return typeof entry.id === "number" && "stack" in entry;
}

export type HeldItemWeights = {
  [key in HeldItemId]?: number;
};

export type HeldItemWeightFunc = (party: Pokemon[]) => number;

export type HeldItemCategoryEntry = HeldItemData & {
  id: HeldItemCategoryId;
  customWeights?: HeldItemWeights;
};

export function isHeldItemCategoryEntry(entry: any): entry is HeldItemCategoryEntry {
  return entry?.id && isHeldItemCategoryEntry(entry.id) && "customWeights" in entry;
}

type HeldItemPoolEntry = {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs;
  weight: number | HeldItemWeightFunc;
};

export type HeldItemPool = HeldItemPoolEntry[];

export function isHeldItemPool(value: any): value is HeldItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}

export type HeldItemTieredPool = {
  [key in RarityTier]?: HeldItemPool;
};

type HeldItemConfigurationEntry = {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
  count?: number | (() => number);
};

export type HeldItemConfiguration = HeldItemConfigurationEntry[];

export type PokemonItemMap = {
  item: HeldItemSpecs;
  pokemonId: number;
};

export type HeldItemSaveData = HeldItemSpecs[];
