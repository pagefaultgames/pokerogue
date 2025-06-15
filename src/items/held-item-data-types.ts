import type Pokemon from "#app/field/pokemon";
import type { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import type { RewardTier } from "#enums/reward-tier";
import type { Stat } from "#enums/stat";

export interface BASE_STAT_TOTAL_DATA {
  statModifier: number;
}

export interface BASE_STAT_FLAT_DATA {
  statModifier: number;
  stats: Stat[];
}

export type HeldItemExtraData = BASE_STAT_TOTAL_DATA | BASE_STAT_FLAT_DATA;

export type HeldItemData = {
  stack: number;
  disabled?: boolean;
  unstealable?: boolean;
  cooldown?: number;
  data?: HeldItemExtraData;
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

export type HeldItemWeights = {
  [key in HeldItemId]?: number;
};

export type HeldItemWeightFunc = (party: Pokemon[]) => number;

export type HeldItemCategoryEntry = HeldItemData & {
  id: HeldItemCategoryId;
  customWeights?: HeldItemWeights;
};

export function isHeldItemCategoryEntry(entry: any): entry is HeldItemCategoryEntry {
  return isHeldItemCategoryEntry(entry.id) && "customWeights" in entry;
}

type HeldItemPoolEntry = {
  entry: HeldItemId | HeldItemCategoryEntry | HeldItemSpecs;
  weight: number | HeldItemWeightFunc;
};

export type HeldItemPool = HeldItemPoolEntry[];

export type HeldItemTieredPool = {
  [key in RewardTier]?: HeldItemPool;
};

type HeldItemConfigurationEntry = {
  entry: HeldItemId | HeldItemCategoryEntry | HeldItemSpecs | HeldItemPool;
  count?: number | (() => number);
  excluded?: HeldItemId[];
};

export type HeldItemConfiguration = HeldItemConfigurationEntry[];
