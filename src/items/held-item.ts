import { globalScene } from "#app/global-scene";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { ConsumableHeldItemAttr, HeldItemAttr, HeldItemRecord } from "#items/held-item-attr";
import type { HeldItemBuilder } from "#items/held-item-builder";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";
import type { NonEmptyTuple } from "type-fest";

/**
 * Base class for all held items, both functional and cosmetic.
 */
export abstract class HeldItemBase {
  public readonly id: HeldItemId;
  public readonly maxStackCount: number;

  /**
   * Whether this item can be transferred to another {@linkcode Pokemon}.
   * @defaultValue `true`
   */
  public isTransferable = true;
  /**
   * Whether this item can be stolen by another {@linkcode Pokemon}.
   * @defaultValue `true`
   */
  public isStealable = true;
  /**
   * Whether this item's effect can be suppressed by a move or ability.
   * @defaultValue `true`
   */
  public isSuppressable = true;

  public get name(): string {
    return i18next.t(`item:${toCamelCase(HeldItemNames[this.id])}.name`);
  }

  public get description(): string {
    return i18next.t(`item:${toCamelCase(HeldItemNames[this.id])}.description`);
  }

  public get iconName(): string {
    return `${HeldItemNames[this.id]?.toLowerCase()}`;
  }

  /**
   * The name of the sound effect played when this item is obtained or transferred.
   * @defaultValue `"se/restore"`
   *
   * @privateRemarks
   * The default value is arbitrary from before the modifier rework. We may want to
   * revisit it at some point.
   */
  public get soundName(): string {
    return "se/restore";
  }

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.id = type;
    this.maxStackCount = maxStackCount;
  }

  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114950716
  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createSummaryIcon(pokemon?: Pokemon, overrideStackCount?: number): Phaser.GameObjects.Container {
    const stackCount = overrideStackCount ?? (pokemon ? this.getStackCount(pokemon) : 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    const container = globalScene.add.container().setScale(0.5).add(item);

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  createPokemonIcon(pokemon: Pokemon): Phaser.GameObjects.Container {
    const pokemonIcon = globalScene.addPokemonIcon(pokemon, -2, 10, 0, 0.5, undefined, true);

    const item = globalScene.add
      .sprite(16, 16, "items")
      .setScale(0.5)
      .setOrigin(0, 0.5)
      .setTexture("items", this.iconName);
    const container = globalScene.add.container(0, 0, [pokemonIcon, item]).setName(pokemon.id.toString());

    const stackText = this.getIconStackText(this.getStackCount(pokemon));
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  getIconStackText(stackCount: number): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1) {
      return null;
    }

    const text = globalScene.add
      .bitmapText(10, 15, "item-count", stackCount.toString(), 11)
      .setLetterSpacing(-0.5)
      .setOrigin(0);
    if (stackCount >= this.getMaxStackCount()) {
      // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114955458
      text.setTint(0xf89890);
    }

    return text;
  }

  getStackCount(pokemon: Pokemon): number {
    const stackCount = pokemon.heldItemManager.getStack(this.id);
    return stackCount;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

/**
 * Class for all non-cosmetic held items
 * (i.e. ones that can have their effects applied during or outside of battle).
 *
 * @typeParam Attrs - A union of {@linkcode HeldItemAttr}s that this class supports.
 * @see {@linkcode HeldItemBuilder}
 * @privateRemarks
 * While exposing the exact kinds of attributes this class supports technically breaks encapsulation,
 * this is required for existing code to work without excessive type assertions.
 */
export class HeldItem<Attrs extends HeldItemAttr = HeldItemAttr> extends HeldItemBase {
  /**
   * An object matching each supported {@linkcode HeldItemEffect} to the attributes that implement said effect.
   */
  private readonly effects: HeldItemRecord<Attrs>;

  // #region Localization

  /**
   * Optional parameters used to localize this item's name.
   * If omitted, will use the default implementation provided from {@linkcode HeldItemBase}.
   */
  private readonly nameParams?: Parameters<typeof i18next.t> | undefined;
  /**
   * Optional parameters used to localize this item's description.
   * If omitted, will use the default implementation provided from {@linkcode HeldItemBase}.
   */
  private readonly descriptionParams?: Parameters<typeof i18next.t> | undefined;
  public readonly customIconName?: string | undefined;

  public override get name(): string {
    return this.nameParams ? i18next.t(...this.nameParams) : super.name;
  }

  public override get description(): string {
    return this.descriptionParams ? i18next.t(...this.descriptionParams) : super.description;
  }

  public override get iconName(): string {
    return this.customIconName ?? super.iconName;
  }

  // #endregion Localization

  protected constructor({
    type,
    effects,
    maxStackCount = 1,
    nameParams,
    descriptionParams,
    iconName,
  }: {
    type: HeldItemId;
    effects: HeldItemRecord<Attrs>;
    maxStackCount?: number;
    nameParams?: Parameters<typeof i18next.t> | undefined;
    descriptionParams?: Parameters<typeof i18next.t> | undefined;
    iconName?: string | undefined;
  }) {
    super(type, maxStackCount);

    this.effects = effects;
    this.nameParams = nameParams;
    this.descriptionParams = descriptionParams;
    this.customIconName = iconName;
  }

  /**
   * Check whether this item handles the given effect at runtime.
   * Narrows the item's effect set to include `E`.
   * @param effect - The {@linkcode HeldItemEffect} to check
   * @returns Whether this item has at least 1 attribute for `effect`.
   * @sealed
   */
  public hasEffect<E extends HeldItemEffect>(effect: E): this is HeldItem<Attrs | HeldItemAttr<E>> {
    return this.effects[effect].length > 0;
  }

  /**
   * Apply all of this item's attributes that pertain to the given effect, subject to their individual
   * {@linkcode HeldItemAttr.shouldApply | shouldApply} conditions.
   * @param effect - The {@linkcode HeldItemEffect | effect} to apply
   * @param params - The parameters to pass to the item attributes' `apply` methods
   * @remarks
   * The execution order of multiple attributes is not guaranteed and should not be relied upon. \
   * Notably, this means that combining {@linkcode ConsumableHeldItemAttr}s with other attributes that depend on the item's current stack count
   * (including other consumable attributes) is undefined behavior.
   * @sealed
   */
  public apply<E extends Attrs["effect"]>(effect: E, params: HeldItemEffectParamMap[E]): void {
    for (const attr of this.getAttrs(effect) as readonly HeldItemAttr<E>[]) {
      if (attr.shouldApply(params)) {
        attr.apply(params);
      }
    }
  }

  /**
   * Retrieve all attributes of this item pertaining to the given effect.
   * @param effect - The {@linkcode HeldItemEffect | effect} to retrieve
   * @returns An array containing all attributes this item has for `effect`.
   * Is guaranteed to be non-empty for properly constructed `HeldItem`s.
   * @remarks
   * The order of the attributes within the returned array is not guaranteed and should not be relied upon.
   * @sealed
   */
  public getAttrs<E extends Attrs["effect"]>(effect: E): NonEmptyTuple<Extract<Attrs, HeldItemAttr<E>>> {
    return this.effects[effect] as NonEmptyTuple<Extract<Attrs, HeldItemAttr<E>>>;
  }
}

/**
 * Abstract class for all items that are purely cosmetic.
 * Currently coincides with the {@linkcode HeldItemBase} class.
 * Might become concrete later on if we want cosmetic items without a subclass.
 *
 * @remarks
 * All cosmetic held items are innately non-stealable, non-transferable, and un-suppressable.
 */
export abstract class CosmeticHeldItem extends HeldItemBase {
  /**
   * This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly differentiate cosmetic items from normal ones.
   */
  private declare _: never;

  public override readonly isStealable = false;
  public override readonly isSuppressable = false;
  public override readonly isTransferable = false;
}
