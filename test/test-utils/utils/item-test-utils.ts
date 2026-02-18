import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemNames } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { ApplicableHeldItemId, allHeldItemsType, HeldItemSpecs } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import { expect } from "vitest";

export function getAllItemSpecs(pokemon: Pokemon): HeldItemSpecs[] {
  const { heldItemManager } = pokemon;
  return heldItemManager.getItems().map(iid => heldItemManager.getItemSpecs(iid)!);
}

/**
 * Apply a single `HeldItem` to a given Pokemon.
 * Does not require the item to be on the Pokemon prior, and will add it with 1 stack if it is not present.
 *
 * @param item - The {@linkcode HeldItemId | ID} of the `HeldItem` class instance to apply
 * @param effect - One of `item`'s effects to apply
 * @param params - Parameters to pass to the class' `apply` method
 * @returns Whether the application succeeded
 * @throws {Error}
 * Fails test immediately if the `pokemon` contained in the parameter map lacks the item in question.
 */
export function applySingleHeldItem<T extends ApplicableHeldItemId, E extends allHeldItemsType[T]["effects"][number]>(
  item: T,
  effect: E,
  params: HeldItemEffectParamMap[E],
): boolean {
  const { pokemon } = params;
  expect(
    pokemon.heldItemManager.hasItem(item.type),
    `Pokemon ${getPokemonNameWithAffix(pokemon)} lacks item of type ${HeldItemNames[item.type]}`,
  ).toBe(true);

  if (!item.shouldApply(effect, params)) {
    return false;
  }
  item.apply(effect, params);
  return true;
}
