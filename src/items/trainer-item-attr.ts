import { allTrainerItems } from "#data/data-lists";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { TrainerItem } from "#items/trainer-item";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";

/**
 * Type matching each {@linkcode TrainerItemEffect} to the subset of `Attrs` that can apply said effect. \
 * Any effects absent from all `Attrs` will map to an empty array.
 */
export type TrainerItemRecord<Attrs extends TrainerItemAttr> = {
  readonly [E in TrainerItemEffect]: [Extract<Attrs, TrainerItemAttr<E>>] extends [never]
    ? readonly []
    : readonly Extract<Attrs, TrainerItemAttr<E>>[];
};

export type WithManager<T extends object> = T & { readonly manager: TrainerItemManager };

export abstract class TrainerItemAttr<out E extends TrainerItemEffect = TrainerItemEffect> {
  /**
   * The {@linkcode TrainerItemEffect} this attribute handles.
   * Should not be a union.
   * @remarks
   * Used by {@linkcode TrainerItemBuilder} to sort items by effect.
   */

  public abstract readonly effect: E;

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
   * Check whether this attribute's effect should be allowed to trigger.
   * @param params - The parameters for this effect
   * @returns Whether this attribute's effect should be applied; defaults to `true` if not overridden
   */
  // biome-ignore lint/correctness/noUnusedFunctionParameters: pseudo-abstract method
  public shouldApply(...params: Parameters<this["apply"]>): boolean {
    return true;
  }

  /**
   * Apply this attribute's effect. \
   * Called if and only if {@linkcode shouldApply} returns `true`.
   * @param params - The parameters for this effect
   * @param manager - A reference to the {@linkcode TrainerItemManager} for the parent item; can be discarded if not needed
   */
  public abstract apply(params: TrainerItemEffectParamMap[E], manager: TrainerItemManager): void;
}
