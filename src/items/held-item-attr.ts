import type { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import type { NonEmptyTuple } from "type-fest";

/**
 * Maps each {@linkcode HeldItemEffect} to its attribute instances for a given set of effects.
 * Effects not in the `Effects` union map to `undefined`.
 */
export type HeldItemRecord<Effects extends HeldItemEffect> = {
  [effect in HeldItemEffect]: effect extends Effects ? NonEmptyTuple<HeldItemAttr<effect>> : undefined;
};

/**
 * Abstract base class for held item attributes.
 */
export abstract class HeldItemAttr<E extends HeldItemEffect = HeldItemEffect> {
  /**
   * The HeldItemID associated with this attribute.
   * Set by the builder class during initialization.
   */
  protected readonly type!: HeldItemId;

  /** The {@linkcode HeldItemEffect} this attribute handles. */
  public abstract readonly effect: E;

  /**
   * Check whether this attribute's effect should be allowed to trigger.
   * @param params - The parameters for this effect
   * @returns Whether this attribute's effect should be applied; defaults to `true` if not overridden
   */
  // biome-ignore lint/correctness/noUnusedFunctionParameters: pseudo-abstract method
  public shouldApply(...params: Parameters<this["apply"]>): boolean {
    return true;
  }

  /**
   * Apply this attribute's effect.
   * Called if and only if {@linkcode shouldApply} returns `true`.
   * @param params - The parameters for this effect
   */
  public abstract apply(params: HeldItemEffectParamMap[E]): void;
}
