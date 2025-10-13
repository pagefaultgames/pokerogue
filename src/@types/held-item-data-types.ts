import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";
import type { AllHeldItems } from "#items/all-held-items";
import type { CosmeticHeldItem } from "#items/held-item";
import type { InferKeys } from "#types/helpers/type-helpers";

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
  /**
   * Whether a form change is active.
   * TODO: This is only temporary to make things work, form change rework should get rid of it.
   * @defaultValue `false`
   */
  active?: boolean;
};

export type HeldItemDataMap = Map<HeldItemId, HeldItemData>;

export type HeldItemSpecs = HeldItemData & {
  id: HeldItemId;
};

export type HeldItemWeights = {
  [key in HeldItemId]?: number;
};

export type HeldItemWeightFunc = (party: Pokemon[]) => number;

export type HeldItemCategoryEntry = HeldItemData & {
  id: HeldItemCategoryId;
  customWeights?: HeldItemWeights;
};

type HeldItemPoolEntry = {
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
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

/** Union type of all `HeldItemId`s whose corresponding items cannot be applied. */
type CosmeticHeldItemId = InferKeys<AllHeldItems, CosmeticHeldItem>;

/** Union type of all `HeldItemId`s whose corresponding items can be applied. */
export type ApplicableHeldItemId = Exclude<keyof AllHeldItems, CosmeticHeldItemId>;
