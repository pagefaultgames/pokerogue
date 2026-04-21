import type { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { ConsumableHeldItem, HeldItem } from "#items/held-item";
import type { HeldItemAttr, HeldItemRecord } from "#items/held-item-attr";
import type { Mutable } from "#types/type-helpers";
import type i18next from "i18next";
import type { Constructor } from "type-fest";

/**
 * Builder class for {@linkcode HeldItem} instances.
 *
 * Accumulates {@linkcode HeldItemAttr} instances via {@linkcode HeldItemBuilder.attr | attr},
 * before transforming them into a concrete `HeldItem` subclass with {@linkcode HeldItemBuilder.build | build}.
 *
 * @typeParam A - A union of all the {@linkcode HeldItemAttr}s registered so far.
 *
 * @example
 * ```ts
 * new HeldItemBuilder(HeldItemId.KINGS_ROCK, 3) //
 *   .attr(FlinchChanceAttr, 0.1)
 *   .build()
 * ```
 * @sealed
 */
export class HeldItemBuilder<A extends HeldItemAttr = never> {
  public readonly id: HeldItemId;
  /** @defaultValue `1` */
  public readonly maxStackCount: number;

  private isTransferable = true;
  private isStealable = true;
  private isSuppressable = true;

  private nameParams?: Parameters<typeof i18next.t>;
  private descriptionParams?: Parameters<typeof i18next.t>;
  private iconName?: string;

  /** Internal sparse map matching effects to their corresponding attributes. */
  private readonly attrMap: Map<HeldItemEffect, HeldItemAttr[]> = new Map();

  constructor(id: HeldItemId, maxStackCount = 1) {
    this.id = id;
    this.maxStackCount = maxStackCount;
  }

  // #region Attributes

  /**
   * Instantiate an {@linkcode HeldItemAttr} and register it on this builder.
   * @param attrType - The constructor of a {@linkcode HeldItemAttr} subclass
   * @param args - Arguments forwarded to the constructor.
   * @returns `this` with `Attr` added to the effect union.
   */
  public attr<Attr extends HeldItemAttr>(
    attrType: Constructor<Attr>,
    ...args: ConstructorParameters<Constructor<Attr>>
  ): HeldItemBuilder<A | Attr> {
    this.addAttr(new attrType(...args));
    return this as unknown as HeldItemBuilder<A | Attr>;
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

  public icon(iconName: string): this {
    this.iconName = iconName;
    return this;
  }

  // #endregion Builder code

  /**
   * Build a non-consumable {@linkcode HeldItem} with the stored attributes and flags.
   * @returns A fully-typed `HeldItem` with all registered attributes.
   */
  public build(): HeldItem<A["effect"]> {
    // @ts-expect-error - TypeScript doesn't support friend classes, so this is the closest we can get to
    // ensuring `HeldItem` is only constructed by its corresponding builder.
    // NB: The type specifier here is required due to TS resolving this as `any`
    const item: HeldItem<A["effect"]> = new HeldItem({
      type: this.id,
      effects: this.buildRecord(),
      maxStackCount: this.maxStackCount,
      nameParams: this.nameParams,
      descriptionParams: this.descriptionParams,
      iconName: this.iconName,
    });
    this.applyFlags(item);
    return item;
  }

  /**
   * Build a {@linkcode ConsumableHeldItem} that supports the {@linkcode ConsumableHeldItem.consume | consume} lifecycle.
   * @returns A fully-typed `ConsumableHeldItem` with all registered attributes.
   */
  public buildConsumable(): ConsumableHeldItem<A["effect"]> {
    // @ts-expect-error - see comment in `build` for rationale
    const item: ConsumableHeldItem<A["effect"]> = new ConsumableHeldItem({
      type: this.id,
      effects: this.buildRecord(),
      maxStackCount: this.maxStackCount,
      nameParams: this.nameParams,
      descriptionParams: this.descriptionParams,
      iconName: this.iconName,
    });
    this.applyFlags(item);
    return item;
  }

  private buildRecord(): HeldItemRecord<A["effect"]> {
    return Object.fromEntries(this.attrMap.entries()) as unknown as HeldItemRecord<A["effect"]>;
  }

  private applyFlags(item: HeldItem<A["effect"]>): void {
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
