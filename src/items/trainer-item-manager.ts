import { allTrainerItems } from "#data/data-lists";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { ItemManager } from "#items/item-manager";
import type { TrainerItemData, TrainerItemSpecs } from "#types/trainer-item-data-types";
import { isTrainerItemSpecs } from "#utils/item-utils";

export class TrainerItemManager extends ItemManager<TrainerItemId, TrainerItemData> {
  // #region Abstract method implementations
  protected override getMaxStackCount(id: TrainerItemId): number {
    return allTrainerItems[id].maxStackCount;
  }

  protected override isSpecs(entry: TrainerItemId | TrainerItemSpecs): entry is TrainerItemSpecs {
    return isTrainerItemSpecs(entry);
  }

  // #endregion Abstract method implementations

  // #region TrainerItem-specific methods

  /** Decrease the durations of all duration-based trainer items on turn end. */
  public decreaseDurations(): void {
    for (const item of this.items.keys()) {
      if (allTrainerItems[item].isLapsing) {
        this.remove(item, 1);
      }
    }
  }

  // #endregion TrainerItem-specific methods
}
