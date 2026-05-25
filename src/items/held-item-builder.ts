import { HeldItemEffect, type HeldItemEffectNames } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { ConsumableHeldItemAttr, HeldItemAttr, HeldItemRecord } from "#items/held-item-attr";
import type { DataMap } from "#types/common";
import type { ErrorType } from "#types/error-type";
import type { Mutable } from "#types/type-helpers";
import type i18next from "i18next";
import type { Constructor } from "type-fest";

/**
 * Internal helper type to add a new attribute to a {@linkcode HeldItemBuilder}, erroring if
 * multiple {@linkcode ConsumableHeldItemAttr}s are added for the same effect.
 */
type AddAttrToBuilder<Attrs extends HeldItemAttr, Effects extends HeldItemEffect, NewAttr extends HeldItemAttr> =
  NewAttr extends ConsumableHeldItemAttr<infer E extends HeldItemEffect>
    ? E extends Effects
      ? ErrorType<`A held item cannot have more than one consumable attribute for a given effect, but 2 were found for HeldItemEffect.${HeldItemEffectNames[E]}!`>
      : HeldItemBuilder<Attrs | NewAttr, Effects | E>
    : HeldItemBuilder<Attrs | NewAttr, Effects>;

/**
 * Builder class for {@linkcode HeldItem} instances.
 *
 * Accumulates {@linkcode HeldItemAttr} instances via {@linkcode HeldItemBuilder.attr | attr},
 * before transforming them into a concrete `HeldItem` instance with {@linkcode HeldItemBuilder.build | build}.
 *
 * @typeParam Attrs - A union of all the {@linkcode HeldItemAttr}s registered so far.
 * @typeParam ConsumableEffects - A union of {@linkcode HeldItemEffect}s corresponding to all {@linkcode ConsumableHeldItemAttr}s registered so far;
 * used to prevent registration of multiple consumable attributes for the same effect.
 *
 * @example
 * ```ts
 * new HeldItemBuilder(HeldItemId.KINGS_ROCK, 3) //
 *   .attr(FlinchChanceAttr, 0.1)
 *   .build()
 * ```
 * @sealed
 */
export class HeldItemBuilder<Attrs extends HeldItemAttr = never, ConsumableEffects extends HeldItemEffect = never> {
  public readonly id: HeldItemId;
  /** @defaultValue `1` */
  public readonly maxStackCount: number;

  private isTransferable = true;
  private isStealable = true;
  private isSuppressable = true;

  private nameParams?: Parameters<typeof i18next.t>;
  private descriptionParams?: Parameters<typeof i18next.t>;
  private icon?: string;

  /**
   * A `DataMap` matching effects to their corresponding (potentially empty) attribute lists.
   * @remarks
   * While it is not strictly necessary to populate unused effects with empty arrays, doing so ensures our runtime behaviour
   * matches the type of `HeldItemRecord<Attrs>` (in which empty arrays are needed to preserve covariance).
   */
  private readonly attrMap = new Map(Object.values(HeldItemEffect).map(e => [e, []])) as DataMap<
    HeldItemEffect,
    HeldItemAttr[]
  >;

  constructor(id: HeldItemId, maxStackCount = 1) {
    this.id = id;
    this.maxStackCount = maxStackCount;
  }

  // #region Attributes

  /**
   * Instantiate an {@linkcode HeldItemAttr} and register it on this builder.
   * @param attrType - The constructor of a {@linkcode HeldItemAttr} subclass to instantiate and register
   * @param args - The arguments used to instantiate `attrType`
   * @returns `this` with `Attr` added to the effect union.
   * @remarks
   * If the attribute to be added is a {@linkcode ConsumableHeldItemAttr},
   * the builder will enforce that it is the _only_ consumable attribute for its respective effects.
   */
  public attr<C extends Constructor<HeldItemAttr>>(
    attrType: C,
    ...args: ConstructorParameters<C>
  ): AddAttrToBuilder<Attrs, ConsumableEffects, InstanceType<C>>;
  public attr<C extends Constructor<HeldItemAttr>>(attrType: C, ...args: ConstructorParameters<C>): this {
    this.addAttr(new attrType(...args));
    return this;
  }

  /** Internal helper method to add an attribute to the builder. */
  private addAttr(attr: HeldItemAttr): void {
    (attr as Mutable<HeldItemAttr>)["type"] = this.id;
    const { effect } = attr;
    // bang is safe since the constructor initializes the map with all effects set to empty arrays
    const existing = this.attrMap.get(effect)!;
    existing.push(attr);
  }

  // #endregion Attributes

  // #region Flags

  /**
   * Prevent this item from being transferred to another {@linkcode Pokemon}.
   * @returns `this`
   */
  public untransferable(): this {
    this.isTransferable = false;
    return this;
  }

  /**
   * Prevent this item from being stolen by another {@linkcode Pokemon}.
   * @returns `this`
   */
  public unstealable(): this {
    this.isStealable = false;
    return this;
  }

  /**
   * Prevent this item's effects from being suppressed by moves or abilities.
   * @returns `this`
   */
  public unsuppressable(): this {
    this.isSuppressable = false;
    return this;
  }

  // #endregion Flags

  // #region Localization

  /**
   * Set this item's name localization parameters.
   * @param params - The parameters to pass to `i18next.t` when localizing this item's name
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default localization key provided by `HeldItemBase`.
   */
  public name(...params: Parameters<typeof i18next.t>): this {
    this.nameParams = params;
    return this;
  }

  /**
   * Set this item's description localization parameters.
   * @param params - The parameters to pass to `i18next.t` when localizing this item's description
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default localization key provided by `HeldItemBase`.
   */
  public description(...params: Parameters<typeof i18next.t>): this {
    this.descriptionParams = params;
    return this;
  }

  /**
   * Set this item's icon name.
   * @param iconName - The name of the icon to use for this item
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default icon provided by `HeldItemBase`.
   */
  public iconName(iconName: string): this {
    this.icon = iconName;
    return this;
  }

  // #endregion Localization

  // #region Builder code

  /**
   * Build a new {@linkcode HeldItem} with the stored attributes and flags.
   * @returns A fully-typed `HeldItem` with all registered attributes.
   * @remarks
   * This will resolve to `never` if no attributes have been registered.
   */
  // TODO: Do we want to allow 0-item builds (and make them cosmetic?)
  public build(): [Attrs] extends [never] ? ErrorType<"Cannot create a HeldItem with no attributes!"> : HeldItem<Attrs>;
  // NB: The implementation signature needs to return a union containing ErrorType to satisfy TypeScript, but we never actually return one ourselves
  public build(): ErrorType<"Cannot create a HeldItem with no attributes!"> | HeldItem<Attrs> {
    // @ts-expect-error - TypeScript doesn't support friend classes, so this is the closest we can get to
    // ensuring `HeldItem` is only constructed by its corresponding builder.
    // NB: The type annotation here is required due to TS resolving generic private-constructor classes as `any`
    // when instantiated by outsiders.
    const item: HeldItem<Attrs> = new HeldItem({
      type: this.id,
      effects: this.buildRecord(),
      maxStackCount: this.maxStackCount,
      nameParams: this.nameParams,
      descriptionParams: this.descriptionParams,
      iconName: this.icon,
    });
    this.applyFlags(item);
    return item;
  }

  private buildRecord(): HeldItemRecord<Attrs> {
    // TODO: Consider removing type assertion after `Object.keys` PR is merged (if possible, albeit likely not)
    return Object.fromEntries(this.attrMap.entries()) as unknown as HeldItemRecord<Attrs>;
  }

  private applyFlags(item: HeldItem<Attrs>): void {
    if (!this.isTransferable) {
      item.isTransferable = false;
    }
    if (!this.isStealable) {
      item.isStealable = false;
    }
    if (!this.isSuppressable) {
      item.isSuppressable = false;
    }
  }
  // #endregion Builder code
}
