import type { AbAttr } from "#abilities/ab-attrs";import { allTrainerItems } from "#data/data-lists";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { TrainerItem } from "#items/trainer-item";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { MoveAttr } from "#types/move-types";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";
import type { IsEqual, IsUnion, NonEmptyTuple } from "type-fest";


/**
 * Type matching each {@linkcode TrainerItemEffect} to the subset of `Attrs` that can apply said effect. \
 * Any effects absent from all `Attrs` will map to an empty array.
 * @package
 * @remarks
 * We cannot outright remove mismatched attributes from the object (or set them to `undefined`/`never`) due to breaking the covariance of `TrainerItem`.
 */
export type TrainerItemRecord<Attrs extends TrainerItemAttr> = {
  readonly [E in TrainerItemEffect]: [Extract<Attrs, TrainerItemAttr<E>>] extends [never]
    ? readonly []
    : NonEmptyTuple<Extract<Attrs, TrainerItemAttr<E>>>;
};

/** 
 * Abstract base class for trainer item attributes.
 *
 * A single {@linkcode TrainerItem} instance can have any number of attributes per effect,
 * in a similar manner to {@linkcode AbAttr}s and {@linkcode MoveAttr}s.
 * @typeParam E - The {@linkcode TrainerItemEffect} this attribute applies to.
 * Should not be a union.
 */
export abstract class TrainerItemAttr<out E extends TrainerItemEffect = TrainerItemEffect> {
  /**
   * The {@linkcode TrainerItemId} associated with this attribute.
   *
   * Set by {@linkcode TrainerItemBuilder} during attribute initialization,
   * and exists solely to allow attributes to identify the item they belong to for message generation and similar purposes.
   * @sealed
   */
  protected readonly type!: TrainerItemId;

  /**
   * @returns A reference to the {@linkcode TrainerItem} instance to which this attribute is attached.
   * @sealed
   */
  protected get item(): TrainerItem {
    // Type assertion is necessary to avoid circular type dependency issues, but this is guaranteed to be correct
    // since the builder sets the attribute's `type` to the correct value at runtime.
    return allTrainerItems[this.type] as TrainerItem;
  }

  /**
   * The {@linkcode TrainerItemEffect} this attribute handles. \
   * Used by {@linkcode TrainerItemBuilder} to sort items by effect, and is otherwise unused.
   * @remarks
   * This will resolve to `never` if `E` is a union, which is desirable since attributes should not be able to apply to multiple effects.
   */
  // add explicit bypass for base class (since `TrainerItemEffect` is itself a union)
  public abstract readonly effect: IsEqual<E, TrainerItemEffect> extends true ? E : IsUnion<E> extends true ? never : E;

  /**
   * Check whether this attribute's effect should be allowed to trigger.
   * @param params - The parameters for this effect
   * @param manager - A reference to the {@linkcode TrainerItemManager} for the given side of the field; can be discarded if not needed
   * @returns Whether this attribute's effect should be applied; defaults to `true` if not overridden
   */
  // biome-ignore lint/correctness/noUnusedFunctionParameters: pseudo-abstract method
  public shouldApply(...[params, manager]: Parameters<this["apply"]>): boolean {
    return true;
  }

  /**
   * Apply this attribute's effect. \
   * Called if and only if {@linkcode shouldApply} returns `true`.
   * @param params - The parameters for this effect
   * @param manager - A reference to the {@linkcode TrainerItemManager} for the given side of the field; can be discarded if not needed
   */
  public abstract apply(params: TrainerItemEffectParamMap[E], manager: TrainerItemManager): void;
}
