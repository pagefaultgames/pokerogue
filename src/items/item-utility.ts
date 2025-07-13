import { allHeldItems, allTrainerItems } from "#data/data-lists";
import { FormChangeItem } from "#enums/form-change-item";
import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import i18next from "i18next";

export function formChangeItemName(id: FormChangeItem) {
  return i18next.t(`modifierType:FormChangeItem.${FormChangeItem[id]}`);
}

export const trainerItemSortFunc = (a: TrainerItemId, b: TrainerItemId): number => {
  const itemNameMatch = allTrainerItems[a].name.localeCompare(allTrainerItems[b].name);
  const itemIdMatch = a - b;

  if (itemIdMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return itemIdMatch;
};

//TODO: revisit this function
export const heldItemSortFunc = (a: HeldItemId, b: HeldItemId): number => {
  const itemNameMatch = allHeldItems[a].name.localeCompare(allHeldItems[b].name);
  const itemIdMatch = a - b;

  if (itemIdMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return itemIdMatch;
};

export const formChangeItemSortFunc = (a: FormChangeItem, b: FormChangeItem): number => {
  const nameA = formChangeItemName(a);
  const nameB = formChangeItemName(b);
  const itemNameMatch = nameA.localeCompare(nameB);
  const itemIdMatch = a - b;

  if (itemIdMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return itemIdMatch;
};
