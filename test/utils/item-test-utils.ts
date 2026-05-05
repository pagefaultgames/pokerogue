import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { HeldItem } from "#items/held-item";
import type { HeldItemAttr } from "#items/held-item-attr";
import type { ApplicableHeldItemId, ExtractItemEffect } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import { expect } from "vitest";

/**
 * Apply a single `HeldItem` on a given Pokemon manually.
 * Used during unit tests to ensure proper baseline functionality.
 *
 * @param itemId - The {@linkcode HeldItemId | ID} of the `HeldItem` class instance to apply
 * @param effect - One of `item`'s {@linkcode HeldItemEffect}s to apply
 * @param params - Parameters to pass to the class' `apply` method
 * @throws
 * Fails test immediately if the `pokemon` contained inside `params` lacks a copy of the item in question.
 * This ensures that items whose functionality depend on stack count or other properties are applied consistently
 * with how they would be during normal gameplay.
 */
export function applySingleHeldItem<T extends ApplicableHeldItemId, E extends ExtractItemEffect<T>>(
  itemId: T,
  effect: E,
  params: HeldItemEffectParamMap[E],
): void {
  const { pokemon } = params;
  const itemObj = allHeldItems[itemId] as HeldItem<HeldItemAttr<E>>;
  expect(
    pokemon.heldItemManager.hasItem(itemObj.type),
    `Pokemon ${getPokemonNameWithAffix(pokemon)} lacks item of type ${HeldItemNames[itemObj.type]}`,
  ).toBe(true);

  itemObj["apply"](effect, params);
}
