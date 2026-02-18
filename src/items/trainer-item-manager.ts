import { allTrainerItems } from "#data/data-lists";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { ItemManager } from "#items/item-manager";
import { isTrainerItemSpecs, type TrainerItemData, type TrainerItemSpecs } from "#types/trainer-item-data-types";

// TODO: Remove unused methods
export class TrainerItemManager extends ItemManager<TrainerItemId, TrainerItemData, TrainerItemSpecs> {
  // #region Abstract method implementations
  protected override getMaxStackCount(id: TrainerItemId): number {
    return allTrainerItems[id].getMaxStackCount();
  }

  protected override isSpecs(entry: TrainerItemId | TrainerItemSpecs): entry is TrainerItemSpecs {
    return isTrainerItemSpecs(entry);
  }

  // #endregion Abstract method implementations

  // #region TrainerItem-specific methods

  public filterRequestedItems(requestedItems: TrainerItemId[], exclude = false) {
    const currentItems = this.getItems();
    return currentItems.filter(it => !exclude && requestedItems.some(entry => it === entry));
  }

  /**
   * Decrease the durations of all duration-based trainer items on turn end.
   */
  // TODO: We should avoid reusing the nebulous "lapse" terminology and name this something like "decreaseDurations"/etc.
  public lapseItems(): void {
    for (const item of this.items.keys()) {
      if (allTrainerItems[item].isLapsing) {
        this.remove(item, 1);
      }
    }
  }

  // #endregion
}
