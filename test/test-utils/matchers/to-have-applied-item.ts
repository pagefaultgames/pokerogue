import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import { allHeldItems } from "#items/all-held-items";
import { CosmeticHeldItem, HeldItem } from "#items/held-item";
import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { isPokemonInstance, receivedStr } from "#test/test-utils/test-utils";
import { ApplicableHeldItemId, allHeldItemsType } from "#types/held-item-data-types";
import type { DefaultHeldItemParams, HeldItemEffectParamMap } from "#types/held-item-parameter";
import type { AtLeastOne } from "#types/type-helpers";
import { enumValueToKey } from "#utils/enums";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";
import { type MockInstance, vi } from "vitest";

/** Options type for {@linkcode toHaveAppliedItem}. */
export type toHaveAppliedItemOptions<E extends HeldItemEffect> = Omit<HeldItemEffectParamMap[E], "pokemon"> extends Record<
  string,
  never
>
  ? never
  : AtLeastOne<Omit<HeldItemEffectParamMap[E], "pokemon">>;

// TODO: Add proper typing on `args` and `effect` later at some point
export function toHaveAppliedItem<T extends ApplicableHeldItemId, E extends allHeldItemsType[T]['effects'][number]>(
  this: MatcherState,
  received: unknown,
  id: T,
  effect: E,
  options: toHaveAppliedItemOptions<E> = {} as toHaveAppliedItemOptions<E>,
): SyncExpectationResult {
  if (!isPokemonInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Pokémon, but got ${receivedStr(received)}!`,
    };
  }

  const item = allHeldItems[id] as CosmeticHeldItem | HeldItem;
  const itemName = HeldItemNames[id];
  if (!(item instanceof HeldItem)) {
    return {
      pass: this.isNot,
      message: () => `Cannot check application of cosmetic item ID ${itemName}!`,
    };
  }

  if (!item.effects.includes(effect)) {
    return {
      pass: this.isNot,
      message: () =>
        `Held item ${itemName}'s effects does not include HeldItemEffect.${enumValueToKey(HeldItemEffect, effect)}!`,
      expected: enumValueToKey(HeldItemEffect, effect),
      actual: item.effects.map(e => enumValueToKey(HeldItemEffect, e)),
    };
  }

  if (!vi.isMockFunction(item.shouldApply)) {
    return {
      pass: this.isNot,
      message: () => `Held item ${itemName}'s \`shouldApply\` function is not a spy!`,
    };
  }

  const params = {
    ...options,
    pokemon: received,
  } as unknown as Partial<HeldItemEffectParamMap[E]>;

  const calls = (item.shouldApply as unknown as MockInstance<typeof item.shouldApply>).mock.calls;
  const pass = this.equals(
    calls,
    [effect, params],
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
