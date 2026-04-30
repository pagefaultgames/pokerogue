import { allTrainerItems } from "#data/data-lists";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { MarkerTrainerItem, TrainerItem } from "#items/trainer-item";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";
import type { TrainerItemManager } from "./trainer-item-manager";

const trainerItems = {} as const satisfies Readonly<Record<TrainerItemId, TrainerItem | MarkerTrainerItem>>;

export function initTrainerItems() {
  Object.assign(allTrainerItems, trainerItems);
  Object.freeze(allTrainerItems);
}

export function applyTrainerItems<T extends TrainerItemEffect>(
  effect: T,
  manager: TrainerItemManager,
  params: TrainerItemEffectParamMap[T],
) {
  if (manager) {
    for (const itemId of manager.getItems()) {
      const item = allTrainerItems[itemId];
      if (item.hasEffect(effect)) {
        item.apply(effect, params, manager);
      }
    }
  }
}
