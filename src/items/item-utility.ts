import { globalScene } from "#app/global-scene";
import { HeldItemCategoryId, type HeldItemId, isItemInCategory } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { PokemonItemMap } from "#types/held-item-data-types";

// Iterate over the party until an item is successfully given
export function assignItemToFirstFreePokemon(item: HeldItemId, party: Pokemon[]): void {
  for (const pokemon of party) {
    if (!pokemon.heldItemManager.isMaxStack(item)) {
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

// TODO: Add a helper function to return all held items in a given category
