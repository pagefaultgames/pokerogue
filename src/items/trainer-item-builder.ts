import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { resolveTrainerItemDescriptionKey, type TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import { TrainerItem } from "#items/trainer-item";
import type { TrainerItemAttr, TrainerItemRecord } from "#items/trainer-item-attr";
import type { DataMap } from "#types/common";
import type { ErrorType } from "#types/error-type";
import type { ItemLocaleConfig } from "#types/locales";
import { toCamelCase } from "#utils/strings";
import type i18next from "i18next";
import type { Constructor } from "type-fest";

/**
 * Builder class for {@linkcode TrainerItem} instances.
 *
 * Accumulates {@linkcode TrainerItemAttr} instances via {@linkcode TrainerItemBuilder.attr | attr},
 * before transforming them into a concrete `TrainerItem` instance with {@linkcode TrainerItemBuilder.build | build}.
 *
 * @typeParam Attrs - A union of all the {@linkcode TrainerItemAttr}s registered so far.
 *
 * @example
 * ```ts
 * new TrainerItemBuilder(TrainerItemId.AMULET_COIN, 3) //
 *   .attr(MoneyMultiplierTrainerItemAttr)
 *   .build()
 * ```
 * @sealed
 */
export class TrainerItemBuilder<Attrs extends TrainerItemAttr = never> {
  public readonly id: TrainerItemId;
  public readonly maxStackCount: number | (() => number);

  /**
   * Whether the item should lapse over time, decreasing its stack count each wave until fully depleted.
   * @defaultValue `false`
   */
  private isLapsing?: boolean;

  private nameParams?: Parameters<typeof i18next.t>;
  private descriptionParams?: Parameters<typeof i18next.t>;
  private icon?: string;

  /**
   * A `DataMap` matching effects to their corresponding (potentially empty) attribute lists.
   * @remarks
   * While it is not strictly necessary to populate unused effects with empty arrays, doing so ensures our runtime behaviour
   * matches the type of `TrainerItemRecord<Attrs>` (in which empty arrays are needed to preserve covariance).
   */
  private readonly attrMap = new Map(Object.values(TrainerItemEffect).map(effect => [effect, []])) as DataMap<
    TrainerItemEffect,
    TrainerItemAttr[]
  >;

  /**
   * Create a new `TrainerItemBuilder`.
   * @param id - The {@linkcode TrainerItemId} of the item to build
   * @param maxStackCount - The maximum stack count of the item to build, or a function that returns it
   */
  constructor(id: TrainerItemId, maxStackCount: number | (() => number)) {
    this.id = id;
    this.maxStackCount = maxStackCount;
  }

  // #region Attributes

  /**
   * Instantiate a {@linkcode TrainerItemAttr} and register it on this builder.
   * @param attrType - The constructor of a {@linkcode TrainerItemAttr} subclass to instantiate and register
   * @param args - The arguments used to instantiate `attrType`
   * @returns `this` with `Attr` added to the effect union.
   */
  public attr<C extends Constructor<TrainerItemAttr>>(
    attrType: C,
    ...args: ConstructorParameters<C>
  ): TrainerItemBuilder<Attrs | InstanceType<C>>;
  public attr<C extends Constructor<TrainerItemAttr>>(attrType: C, ...args: ConstructorParameters<C>): this {
    this.addAttr(new attrType(...args));
    return this;
  }

  /** Internal helper method to add an attribute to the builder. */
  private addAttr(attr: TrainerItemAttr): void {
    // @ts-expect-error - property is readonly (can't cast to Mutable as it would remove protected members)
    attr["type"] = this.id;
    const { effect } = attr;
    const existing = this.attrMap.get(effect);
    existing.push(attr);
  }

  // #endregion Attributes

  // #region Flags

  /**
   * Make this item lapse over time, losing stacks once per wave until removed.
   * @returns `this`
   */
  public lapsing(): this {
    this.isLapsing = true;
    return this;
  }

  // #endregion Flags

  // #region Localization

  /**
   * Set this item's name localization configuration.
   * @param config - The localization configuration object
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default localization key provided by `TrainerItemBase`.
   */
  public name(config: ItemLocaleConfig): this {
    const key = config.key ?? `item:${toCamelCase(TrainerItemNames[this.id])}.name`;
    this.nameParams = config.options == null ? [key] : [key, config.options];
    return this;
  }

  /**
   * Set this item's description localization configuration.
   * @param config - The localization configuration object
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default localization key provided by `TrainerItemBase`.
   */
  public description(config: ItemLocaleConfig): this {
    const key = resolveTrainerItemDescriptionKey(this.id, config.key);
    this.descriptionParams = config.options == null ? [key] : [key, config.options];
    return this;
  }

  /**
   * Set this item's icon name.
   * @param iconName - The name of the icon to use for this item
   * @returns `this`
   * @remarks
   * If this method is not called, the item will use the default icon provided by `TrainerItemBase`.
   */
  public iconName(iconName: string): this {
    this.icon = iconName;
    return this;
  }

  // #endregion Builder code

  /**
   * Build a new {@linkcode TrainerItem} with the stored attributes and flags.
   * @returns A fully-typed `TrainerItem` with all registered attributes.
   * @remarks
   * This will resolve to `never` if no attributes have been registered.
   */
  // TODO: Do we want to allow 0-effect builds (and make them markers?)
  public build(): [Attrs] extends [never]
    ? ErrorType<"Cannot create a TrainerItem with no attributes!">
    : TrainerItem<Attrs>;
  // NB: The implementation signature needs to return a union containing ErrorType to satisfy TypeScript, but we never actually return one ourselves
  public build(): ErrorType<"Cannot create a TrainerItem with no attributes!"> | TrainerItem<Attrs> {
    // @ts-expect-error - TypeScript doesn't support friend classes, so this is the closest we can get to
    // ensuring `TrainerItem` is only constructed by its corresponding builder.
    // NB: The type specifier here is required due to TS resolving this as `any`
    const item: TrainerItem<Attrs> = new TrainerItem({
      type: this.id,
      effects: this.buildRecord(),
      maxStackCount: this.maxStackCount,
      nameParams: this.nameParams,
      descriptionParams: this.descriptionParams,
      iconName: this.icon,
      lapsing: this.isLapsing,
    });
    return item;
  }

  /**
   * Convert the builder's internal map of attributes into a {@linkcode TrainerItemRecord} for use in the built `TrainerItem`.
   */
  private buildRecord(): TrainerItemRecord<Attrs> {
    return Object.fromEntries(this.attrMap.entries()) as unknown as TrainerItemRecord<Attrs>;
  }
  // #endregion Builder code
}
