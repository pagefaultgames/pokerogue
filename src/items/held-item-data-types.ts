// TODO: move to `src/@types/`

import type { FormChangeItem } from "#enums/form-change-item";
import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";

export type HeldItemData = {
  stack: number;
  disabled?: boolean;
  cooldown?: number;
};

export type HeldItemDataMap = {
  [key in HeldItemId]?: HeldItemData;
};

export type HeldItemSpecs = HeldItemData & {
  id: HeldItemId;
};

export function isHeldItemSpecs(entry: any): entry is HeldItemSpecs {
  return typeof entry.id === "number" && "stack" in entry;
}

// Types used for form change items
interface FormChangeItemData {
  active: boolean;
}

export type FormChangeItemPropertyMap = {
  [key in FormChangeItem]?: FormChangeItemData;
};

export type FormChangeItemSpecs = FormChangeItemData & {
  id: FormChangeItem;
};

export function isFormChangeItemSpecs(entry: any): entry is FormChangeItemSpecs {
  return typeof entry.id === "number" && "active" in entry;
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
  entry: HeldItemId | HeldItemCategoryId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool | FormChangeItemSpecs;
  count?: number | (() => number);
};

export type HeldItemConfiguration = HeldItemConfigurationEntry[];

export type PokemonItemMap = {
  item: HeldItemSpecs | FormChangeItemSpecs;
  pokemonId: number;
};

export type HeldItemSaveData = (HeldItemSpecs | FormChangeItemSpecs)[];
