import { globalScene } from "#app/global-scene";
import { type HeldItemCategoryId, type HeldItemId, isItemInCategory } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { PokemonItemMap } from "#types/held-item-data-types";
import type { NonEmptyTuple } from "type-fest";

// Iterate over the party until an item is successfully given
export function assignItemToFirstFreePokemon(item: HeldItemId, party: Pokemon[]): void {
  for (const pokemon of party) {
    if (!pokemon.heldItemManager.isMaxStack(item)) {
      pokemon.heldItemManager.add(item);
      return;
    }
  }
}

/**
 * Retrieve all items in the player's party that are of the given category, paired with the Pokemon that holds them.
 * @param category - The {@linkcode HeldItemCategory} to retrieve
 * @returns An array containing all items in the party that are of the given category.
 */
export function getPartyItemsInCategory(category: HeldItemCategoryId): NonEmptyTuple<PokemonItemMap> | readonly [] {
  const berries = globalScene
    .getPlayerParty()
    .values()
    .flatMap(pokemon =>
      pokemon
        .getHeldItems()
        .values()
        .filter(item => isItemInCategory(item, category))
        .map(id => {
          // non-null assertion justified since we only consider berries that are owned by the pokemon
          const specs = pokemon.heldItemManager.getItemSpecs(id)!;
          return { item: specs, pokemonId: pokemon.id } satisfies PokemonItemMap;
        }),
    )
    .toArray();

  // the fact that this requires an `as unknown` cast makes me weep
  return berries as unknown as NonEmptyTuple<PokemonItemMap> | readonly [];
}
