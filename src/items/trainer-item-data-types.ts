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

type TrainerItemConfigurationEntry = {
  entry: TrainerItemId | TrainerItemSpecs;
  count?: number | (() => number);
};

export type TrainerItemConfiguration = TrainerItemConfigurationEntry[];
