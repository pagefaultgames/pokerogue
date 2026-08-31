import type { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { AllTrainerItems } from "#items/all-trainer-items";
import type { MarkerTrainerItem, TrainerItem } from "#items/trainer-item";
import type { TrainerItemAttr } from "#items/trainer-item-attr";
import type { InferKeys } from "#types/type-helpers";
import type { NonEmptyTuple } from "type-fest";

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

interface TrainerItemPoolEntry {
  entry: TrainerItemId;
  weight: number;
}

export type TrainerItemPool = NonEmptyTuple<TrainerItemPoolEntry>;

export type TrainerItemTieredPool = Partial<Record<RarityTier, TrainerItemPool>>;

interface TrainerItemConfigurationEntry {
  entry: TrainerItemId | TrainerItemSpecs;
  count?: number | (() => number);
}

export type TrainerItemConfiguration = TrainerItemConfigurationEntry[];

export type TrainerItemSaveData = TrainerItemSpecs[];

/** Union type of all `TrainerItemId`s whose corresponding items cannot be applied. */
type MarkerTrainerItemId = InferKeys<AllTrainerItems, MarkerTrainerItem>;

/** Union type of all `TrainerItemId`s whose corresponding items can be applied. */
export type ApplicableTrainerItemId = Exclude<keyof AllTrainerItems, MarkerTrainerItemId>;

/** Utility type to retrieve the effects of a given {@linkcode TrainerItem} based on its ID. */
export type ExtractTrainerItemEffect<T extends ApplicableTrainerItemId> =
  AllTrainerItems[T] extends TrainerItem<infer Attr extends TrainerItemAttr> ? Attr["effect"] : never;
