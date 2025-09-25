import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { HeldItemCategoryId, type HeldItemId, isItemInCategory } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { PokemonItemMap } from "#types/held-item-data-types";
import { allHeldItems } from "./all-held-items";

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

// Iterate over the party until an item is successfully given
export function assignItemToFirstFreePokemon(item: HeldItemId, party: Pokemon[]): void {
  for (const pokemon of party) {
    const stack = pokemon.heldItemManager.getStack(item);
    if (stack < allHeldItems[item].getMaxStackCount()) {
      pokemon.heldItemManager.add(item);
      return;
    }
  }
}

// Creates an item map of berries to pokemon, storing each berry separately (splitting up stacks)
export function getPartyBerries(): PokemonItemMap[] {
  const pokemonItems: PokemonItemMap[] = [];
  globalScene.getPlayerParty().forEach(pokemon => {
    const berries = pokemon.getHeldItems().filter(item => isItemInCategory(item, HeldItemCategoryId.BERRY));
    berries.forEach(berryId => {
      const berryStack = pokemon.heldItemManager.getStack(berryId);
      pokemonItems.push({ item: { id: berryId, stack: berryStack }, pokemonId: pokemon.id });
    });
  });
  return pokemonItems;
}
