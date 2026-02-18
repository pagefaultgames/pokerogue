import type { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";

export interface TrainerItemData {
  /** The stack count of the item, or its duration for duration-based trainer items. */
  stack: number;
  disabled?: boolean;
  cooldown?: number;
}

export type TrainerItemDataMap = Map<TrainerItemId, TrainerItemData>;

export interface TrainerItemSpecs extends TrainerItemData {
  id: TrainerItemId;
}

// TODO: This should emphatically not be in "#types"
export function isTrainerItemSpecs(entry: unknown): entry is TrainerItemSpecs {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  return (
    typeof (entry as TrainerItemSpecs).id === "number"
    && typeof (entry as TrainerItemSpecs).stack === "number"
    && (entry as TrainerItemSpecs).id in TrainerItemId
  );
}

interface TrainerItemPoolEntry {
  entry: TrainerItemId;
  weight: number;
}

export type TrainerItemPool = TrainerItemPoolEntry[];

export type TrainerItemTieredPool = {
  [key in RarityTier]?: TrainerItemPool;
};

export function isTrainerItemPool(value: any): value is TrainerItemPool {
  return Array.isArray(value) && value.every(entry => "entry" in entry && "weight" in entry);
}

interface TrainerItemConfigurationEntry {
  entry: TrainerItemId | TrainerItemSpecs;
  count?: number | (() => number);
}

export type TrainerItemConfiguration = TrainerItemConfigurationEntry[];

export type TrainerItemSaveData = TrainerItemSpecs[];
