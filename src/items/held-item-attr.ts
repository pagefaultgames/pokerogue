import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import type { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { HeldItem } from "#items/held-item";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";

/**
 * Type matching each {@linkcode HeldItemEffect} to the subset of `Attrs` that can apply said effect. \
 * Any effects absent from all `Attrs` will map to an empty array.
 */
export type HeldItemRecord<Attrs extends HeldItemAttr> = {
  readonly [E in HeldItemEffect]: [Extract<Attrs, HeldItemAttr<E>>] extends [never]
    ? readonly []
    : readonly Extract<Attrs, HeldItemAttr<E>>[];
};

/**
 * Abstract base class for held item attributes.
 *
 * A single {@linkcode HeldItem} instance can have any number of attributes per effect,
 * in a similar manner to {@linkcode AbAttr}s and {@linkcode MoveAttr}s.
 */
export abstract class HeldItemAttr<out E extends HeldItemEffect = HeldItemEffect> {
  /**
   * The {@linkcode HeldItemId} associated with this attribute.
   *
   * Set by {@linkcode HeldItemBuilder} during attribute initialization,
   * and exists solely to allow attributes to identify the item they belong to for message generation and similar purposes.
   * @sealed
   * @privateRemarks
   * This cannot be typed as `ApplicableHeldItemId` due to causing a circular type dependency.
   */
  protected readonly type!: HeldItemId;

  /**
   * @returns A reference to the {@linkcode HeldItem} instance to which this attribute is attached.
   * @sealed
   */
  protected get item(): HeldItem {
    // Type assertion is necessary to avoid circular type dependency issues, but this is guaranteed to be correct
    // since the builder sets the attribute's `type` to the correct value at runtime.
    return allHeldItems[this.type] as HeldItem;
  }

  /**
   * The {@linkcode HeldItemEffect} this attribute handles.
   * Should not be a union.
   * @remarks
   * Used by {@linkcode HeldItemBuilder} to sort items by effect.
   */
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
   * Apply this attribute's effect. \
   * Called if and only if {@linkcode shouldApply} returns `true`.
   * @param params - The parameters for this effect
   */
  public abstract apply(params: HeldItemEffectParamMap[E]): void;
}

/**
 * Abstract base class for consumable held item attributes,
 * i.e. ones that consume their source items after triggering.
 *
 * Each item may have a maximum of one consumable attribute per effect, enforced by the builder during creation.
 *
 * @remarks
 * Combining with other attributes that depend on stack count may have unexpected results.
 */
export abstract class ConsumableHeldItemAttr<E extends HeldItemEffect = HeldItemEffect> extends HeldItemAttr<E> {
  private declare readonly _: never;

  /**
   * Consume the item associated with this attribute and apply relevant effects.
   * Should be called by the attribute's `apply` method once finished.
   * @param pokemon - The {@linkcode Pokemon} consuming the item
   * @param remove - (Default `true`) Whether to remove the item during consumption
   * @param unburden - (Default `true`) Whether to trigger item loss abilities (i.e. Unburden) when consuming the item
   * @sealed
   */
  protected consume(pokemon: Pokemon, remove = true, unburden = true): void {
    if (remove) {
      pokemon.heldItemManager.remove(this.type, 1);
      // TODO: Turn this into updateItemBar or something
      globalScene.updateItems(pokemon.isPlayer());
    }
    if (unburden) {
      applyAbAttrs("PostItemLostAbAttr", { pokemon });
    }
  }
}
