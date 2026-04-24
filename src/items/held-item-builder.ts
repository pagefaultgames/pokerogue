import type { HeldItemEffect, HeldItemEffectNames } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { ConsumableHeldItemAttr, HeldItemAttr, HeldItemRecord } from "#items/held-item-attr";
import type { ErrorType } from "#types/error-type";
import type { Mutable } from "#types/type-helpers";
import type i18next from "i18next";
import type { Constructor } from "type-fest";

/**
 * Internal helper type to add a new attribute to a {@linkcode HeldItemBuilder}, erroring if
 * multiple {@linkcode ConsumableHeldItemAttr}s
 */
type AddAttrToBuilder<Attrs extends HeldItemAttr, Effects extends HeldItemEffect, NewAttr extends HeldItemAttr> =
  NewAttr extends ConsumableHeldItemAttr<infer E extends HeldItemEffect>
    ? E extends Effects
      ? ErrorType<`A held item cannot have more than one consumable attribute for a given effect, but 2 were found for HeldItemEffect.${HeldItemEffectNames[E]}!`>
      : HeldItemBuilder<Attrs | NewAttr, Effects | E>
    : HeldItemBuilder<Attrs | NewAttr, Effects | NewAttr["effect"]>;

/**
 * Builder class for {@linkcode HeldItem} instances.
 *
 * Accumulates {@linkcode HeldItemAttr} instances via {@linkcode HeldItemBuilder.attr | attr},
 * before transforming them into a concrete `HeldItem` subclass with {@linkcode HeldItemBuilder.build | build}.
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

  /** Internal sparse map matching effects to their corresponding attributes. */
  private readonly attrMap: Map<HeldItemEffect, HeldItemAttr[]> = new Map();

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
    const existing = this.attrMap.get(effect);
    if (existing) {
      existing.push(attr);
    } else {
      this.attrMap.set(effect, [attr]);
    }
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

  public name(...params: Parameters<typeof i18next.t>): this {
    this.nameParams = params;
    return this;
  }

  public description(...params: Parameters<typeof i18next.t>): this {
    this.descriptionParams = params;
    return this;
  }

  public iconName(iconName: string): this {
    this.icon = iconName;
    return this;
  }

  // #endregion Builder code

  /**
   * Build a non-consumable {@linkcode HeldItem} with the stored attributes and flags.
   * @returns A fully-typed `HeldItem` with all registered attributes.
   */
  public build(): HeldItem<Attrs["effect"]> {
    // @ts-expect-error - TypeScript doesn't support friend classes, so this is the closest we can get to
    // ensuring `HeldItem` is only constructed by its corresponding builder.
    // NB: The type specifier here is required due to TS resolving this as `any`
    const item: HeldItem<Attrs["effect"]> = new HeldItem({
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

  private buildRecord(): HeldItemRecord<Attrs["effect"]> {
    // TODO: Remove type assertion after `Object.keys` PR
    return Object.fromEntries(this.attrMap.entries()) as unknown as HeldItemRecord<Attrs["effect"]>;
  }

  private applyFlags(item: HeldItem<Attrs["effect"]>): void {
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
