// TODO: move to `src/@types/`
import type { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";

export type TrainerItemData = {
  stack: number;
  disabled?: boolean;
  cooldown?: number;
};

export type TrainerItemDataMap = {
  [key in TrainerItemId]?: TrainerItemData;
};

export type TrainerItemSpecs = TrainerItemData & {
  id: TrainerItemId;
};

export function isTrainerItemSpecs(entry: any): entry is TrainerItemSpecs {
  return typeof entry.id === "number" && "stack" in entry;
}

type TrainerItemPoolEntry = {
  entry: TrainerItemId;
  weight: number;
};

export type TrainerItemPool = TrainerItemPoolEntry[];

export type TrainerItemTieredPool = {
  [key in RarityTier]?: TrainerItemPool;
};

export function isTrainerItemPool(value: any): value is TrainerItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}

type TrainerItemConfigurationEntry = {
  entry: TrainerItemId | TrainerItemSpecs;
  count?: number | (() => number);
};

export type TrainerItemConfiguration = TrainerItemConfigurationEntry[];

export type TrainerItemSaveData = TrainerItemSpecs[];
