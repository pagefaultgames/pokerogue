import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { BattleType } from "#enums/battle-type";
import { type HeldItemCategoryId, type HeldItemId, isItemInCategory } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { PokemonItemMap } from "#types/held-item-data-types";
import { ValueHolder } from "#utils/value-holder";
import type { NonEmptyTuple } from "type-fest";

export const MAX_STACK_COUNT_TINT = 0xf89890;

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
  const items = globalScene
    .getPlayerParty()
    .values()
    .flatMap(pokemon =>
      pokemon
        .getHeldItems()
        .values()
        .filter(item => isItemInCategory(item, category))
        .map(id => {
          // non-null assertion justified since we only consider items that are owned by the pokemon
          const specs = pokemon.heldItemManager.getItemSpecs(id)!;
          return { item: specs, pokemonId: pokemon.id } satisfies PokemonItemMap;
        }),
    )
    .toArray();

  // the fact that this requires an `as unknown` cast makes me weep
  return items as unknown as NonEmptyTuple<PokemonItemMap> | readonly [];
}

/**
 * Determine the count of an item that can be transfered from one pokemon to another.
 * @param heldItemId - The {@linkcode HeldItemId} to transfer.
 * @param holder - The {@linkcode Pokemon} holding the item to transfer.
 * @param receiver - The {@linkcode Pokemon} receiving the item.
 * @returns The stack size of the item that can be transfered.
 */
export function getTransferableAmount(heldItemId: HeldItemId, holder: Pokemon, receiver: Pokemon): number {
  const holderItemStack = holder.heldItemManager.getStack(heldItemId);
  const receiverItemStack = receiver.heldItemManager.getStack(heldItemId);

  const maxStackCount = allHeldItems[heldItemId].maxStackCount;
  if (receiverItemStack >= maxStackCount) {
    return 0;
  }
  return Math.min(holderItemStack, maxStackCount - receiverItemStack);
}

/**
 * Determine if an item can be stolen from a pokemon by another.
 * @param heldItemId - The {@linkcode HeldItemId} to steal.
 * @param holder - The {@linkcode Pokemon} holding the item to steal.
 * @param receiver - The {@linkcode Pokemon} stealing the item.
 * @returns true if the item can be stolen.
 */
export function canSteal(heldItemId: HeldItemId, holder: Pokemon, receiver: Pokemon): boolean {
  const blockTheft = new ValueHolder(false);

  applyAbAttrs("BlockItemTheftAbAttr", { pokemon: holder, cancelled: blockTheft });

  if (blockTheft.value) {
    return false;
  }

  return getTransferableAmount(heldItemId, holder, receiver) > 0;
}

/**
 * Transfer a held item from a pokemon to another, and update the item bars.
 * @param heldItemId - The {@linkcode HeldItemId} to transfer.
 * @param holder - The {@linkcode Pokemon} holding the item to transfer.
 * @param receiver - The {@linkcode Pokemon} receiving the item.
 * @param transferQuantity - How many of the chosen item to transfer.
 * @param temporary - Whether the transfer should affect the tempStack (default false).
 * @returns true if at least one item was transfered.
 */
// TODO: allow for transfering tempStack instead of stack
export function tryTransferHeldItem(
  heldItemId: HeldItemId,
  holder: Pokemon,
  receiver: Pokemon,
  transferQuantity = 1,
  temporary = false,
): boolean {
  const countTaken = Math.min(transferQuantity, getTransferableAmount(heldItemId, holder, receiver));
  if (countTaken <= 0) {
    return false;
  }

  if (temporary) {
    holder.heldItemManager.addTempStack(heldItemId, -1 * countTaken);
    receiver.heldItemManager.addTempStack(heldItemId, countTaken);
    return true;
  }

  holder.heldItemManager.remove(heldItemId, countTaken);
  receiver.heldItemManager.add(heldItemId, countTaken);

  return true;
}

/**
 * Transfer a held item from a pokemon to another, and update the item bars.
 * @param heldItemId - The {@linkcode HeldItemId} to transfer.
 * @param holder - The {@linkcode Pokemon} holding the item to transfer.
 * @param receiver - The {@linkcode Pokemon} receiving the item.
 * @param transferQuantity - How many of the chosen item to transfer.
 * @returns true if at least one item was transfered.
 */
export function tryStealHeldItem(
  heldItemId: HeldItemId,
  holder: Pokemon,
  receiver: Pokemon,
  stolenQuantity = 1,
): boolean {
  const blockTheft = new ValueHolder(false);

  applyAbAttrs("BlockItemTheftAbAttr", { pokemon: holder, cancelled: blockTheft });

  if (blockTheft.value) {
    return false;
  }

  // Stealing items is permanent (both ways) when fighting wild Pokémon.
  // It is temporary (both ways) otherwise.
  const temporary = globalScene.currentBattle.battleType !== BattleType.WILD;
  const successfulTheft = tryTransferHeldItem(heldItemId, holder, receiver, stolenQuantity, temporary);

  if (!successfulTheft) {
    return false;
  }

  globalScene.updateItemBar();
  globalScene.updateItemBar(false);

  if (holder.heldItemManager.getStack(heldItemId) === 0) {
    applyAbAttrs("PostItemLostAbAttr", { pokemon: holder });
  }

  return true;
}
