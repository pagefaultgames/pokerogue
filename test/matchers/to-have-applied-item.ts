import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemNames } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import { getOnelineDiffStr } from "#test/utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/utils/test-utils";
import type { ApplicableHeldItemId, ExtractHeldItemEffect } from "#types/held-item-data-types";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import type { AtLeastOne } from "#types/type-helpers";
import { enumValueToKey } from "#utils/enums";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";
import { type MockInstance, vi } from "vitest";

/**
 * Internal union type containing all {@linkcode HeldItemEffect}s whose parameters
 * solely contain `Pokemon`.
 */
type EffectsUsingDefaultParams = {
  [E in HeldItemEffect]: keyof HeldItemEffectParamMap[E] extends "pokemon" ? E : never;
}[HeldItemEffect];

/** Options type for {@linkcode toHaveAppliedItem}. */
export type ToHaveAppliedItemOptions<E extends HeldItemEffect> = E extends EffectsUsingDefaultParams
  ? never
  : AtLeastOne<Omit<HeldItemEffectParamMap[E], "pokemon">>;

/**
 * Used during unit tests to ensure effects were applied correctly.
 * @param received - The object to check. Should be a {@linkcode Pokemon}
 * @param id - The {@linkcode HeldItemId} of the item being applied
 * @param effect - One of `item`'s applicable {@linkcode HeldItemEffect}s whose application will be checked
 * @param options - A partially-filled parameters object used to query the arguments `item` was called with
 * @returns Whether the matcher passed
 */
export function toHaveAppliedItem<T extends ApplicableHeldItemId, E extends ExtractHeldItemEffect<T>>(
  this: MatcherState,
  received: unknown,
  id: T,
  effect: E,
  options: ToHaveAppliedItemOptions<E> = {} as ToHaveAppliedItemOptions<E>,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const item: HeldItem = allHeldItems[id];
  const itemName = HeldItemNames[id];

  // This is technically checked by the type system, but better safe than sorry
  if (!(item instanceof HeldItem)) {
    return {
      pass: this.isNot,
      message: () => `Cannot check application of cosmetic item ID ${itemName}!`,
    };
  }

  if (!item.hasEffect(effect)) {
    return {
      pass: this.isNot,
      message: () =>
        `Held item ${itemName}'s effects does not include HeldItemEffect.${enumValueToKey(HeldItemEffect, effect)}!`,
      expected: enumValueToKey(HeldItemEffect, effect),
      actual: (Object.keys(item["effects"]) as `${HeldItemEffect}`[]).map(e =>
        enumValueToKey(HeldItemEffect, Number(e) as HeldItemEffect),
      ),
    };
  }

  if (!vi.isMockFunction(item.apply)) {
    return {
      pass: this.isNot,
      message: () => `Held item ${itemName}'s \`apply\` function is not a spy!`,
    };
  }

  const params = {
    ...options,
  } as unknown as Partial<HeldItemEffectParamMap[E]>;

  const applyCalls = (item.apply as unknown as MockInstance<typeof item.apply>).mock.calls;
  const matchingCalls = applyCalls.filter(([, callParams]) => callParams.pokemon === received);
  // Only consider matching pokemon (above), but we strip the pokemon when comparing
  // as deep comparisons of Pokemon objects are prohibitively expensive
  const calls = matchingCalls.map(([callEffect, callParams]) => {
    const { pokemon: _pokemon, ...rest } = callParams;
    return [callEffect, rest];
  });

  const pass = this.equals(
    calls,
    [[effect, params]],
    [...this.customTesters, this.utils.subsetEquality, this.utils.iterableEquality],
  );

  // TODO: Make a more detailed error message

  const pkmName = getPokemonNameWithAffix(received);
  if (Object.keys(options).length === 0) {
    return {
      pass,
      message: () =>
        this.isNot
          ? `Expected ${pkmName} to have NOT applied ${itemName}, but it did!`
          : `Expected ${pkmName} to have applied ${itemName}, but it didn't!`,
      expected: id,
      actual: calls,
    };
  }

  const expectedStr = getOnelineDiffStr.call(this, options);

  return {
    pass,
    message: () =>
      this.isNot
        ? `Expected ${pkmName} to have NOT applied ${itemName} with ${expectedStr}, but it did!`
        : `Expected ${pkmName} to have applied ${itemName} with ${expectedStr}, but it didn't!`,
    expected: id,
    actual: calls,
  };
}
