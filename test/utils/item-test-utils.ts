import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { AllHeldItems } from "#items/all-held-items";
import type { HeldItem } from "#items/held-item";
import type { ApplicableHeldItemId } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import { expect } from "vitest";

/**
 * Apply a single `HeldItem` on a given Pokemon manually.
 * Used during unit tests to ensure proper baseline functionality.
 *
 * @param itemId - The {@linkcode HeldItemId | ID} of the `HeldItem` class instance to apply
 * @param effect - The corrsponding {@linkcode HeldItemEffect} to apply
 * @param params - Parameters to pass to the class' `apply` method
 * @returns Whether the application succeeded.
 * @throws
 * Fails test immediately if the `pokemon` contained inside `params` lacks a copy of the item in question.
 */
export function applySingleHeldItem<T extends ApplicableHeldItemId, E extends AllHeldItems[T]["effects"][number]>(
  itemId: T,
  effect: E,
  params: HeldItemEffectParamMap[E],
): boolean {
  const { pokemon } = params;
  const itemObj = allHeldItems[itemId] as HeldItem<AllHeldItems[T]["effects"]>;
  expect(
    pokemon.heldItemManager.hasItem(itemObj.type),
    `Pokemon ${getPokemonNameWithAffix(pokemon)} lacks item of type ${HeldItemNames[itemObj.type]}`,
  ).toBe(true);

  if (!itemObj.shouldApply(effect, params)) {
    return false;
  }
  itemObj.apply(effect, params);
  return true;
}
