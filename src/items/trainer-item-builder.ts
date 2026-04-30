import { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { TrainerItem } from "#items/trainer-item";
import type { TrainerItemAttr, TrainerItemRecord } from "#items/trainer-item-attr";
import type { ErrorType } from "#types/error-type";
import type { Mutable } from "#types/type-helpers";
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
  /** @defaultValue `1` */
  public readonly maxStackCount: number;

  /** Whether the item should lapse over time, decreasing its stack count each wave until fully depleted. */
  private isLapsing?: boolean;

  private nameParams?: Parameters<typeof i18next.t>;
  private descriptionParams?: Parameters<typeof i18next.t>;
  private icon?: string;

  /** A `Map` matching effects to their corresponding attributes. */
  private readonly attrMap: Map<TrainerItemEffect, TrainerItemAttr[]> = new Map(
    Object.values(TrainerItemEffect).map(effect => [effect, []]),
  );

  constructor(id: TrainerItemId, maxStackCount = 1) {
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
    (attr as Mutable<TrainerItemAttr>)["type"] = this.id;
    const { effect } = attr;
    // bang is safe since the constructor initializes the map with all effects set to empty arrays
    const existing = this.attrMap.get(effect)!;
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

  // TODO: Add `lapsing` flag and corresponding builder method

  /**
   * Build a new {@linkcode TrainerItem} with the stored attributes and flags.
   * @returns A fully-typed `TrainerItem` with all registered attributes.
   * @remarks
   * This will resolve to `never` if no attributes have been registered.
   */
  // TODO: Do we want to allow 0-item builds (and make them cosmetic?)
  public build(): [Attrs] extends [never]
    ? ErrorType<"Cannot create a TrainerItem with no attributes!">
    : TrainerItem<Attrs>;
  // NB: The implementation signature needs to return a union here to satisfy TypeScript, but we never actually return one ourselves
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

  private buildRecord(): TrainerItemRecord<Attrs> {
    // TODO: Consider removing type assertion after `Object.keys` PR
    return Object.fromEntries(this.attrMap.entries()) as unknown as TrainerItemRecord<Attrs>;
  }
  // #endregion Builder code
}
