import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { HeldItemAttr, HeldItemRecord } from "#items/held-item-attr";
import type { HeldItemBuilder } from "#items/held-item-builder";
import type { HeldItemEffectParamMap } from "#types/held-item-parameter";
import i18next from "i18next";
import type { NonEmptyTuple } from "type-fest";

/**
 * Base class for all held items, both functional and cosmetic.
 */
export abstract class HeldItemBase {
  // TODO: Rename parameter to `id` or similar
  public readonly type: HeldItemId;
  public readonly maxStackCount: number;
  // TODO: Consider converting these to a bitmask for efficiency

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
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.name`);
  }

  public get description(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.description`);
  }

  public get iconName(): string {
    return `${HeldItemNames[this.type]?.toLowerCase()}`;
  }

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.type = type;
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
    const stackCount = pokemon.heldItemManager.getStack(this.type);
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
 * @see {@linkcode HeldItemBuilder}
 */
export class HeldItem<Effects extends HeldItemEffect = HeldItemEffect> extends HeldItemBase {
  /** An object matching each supported {@linkcode HeldItemEffect} to the attributes that implement said effect. */
  public readonly effects: HeldItemRecord<Effects>;

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
    effects: HeldItemRecord<Effects>;
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
   * Retrieve all {@linkcode HeldItemAttr}s this item has for a given effect.
   * @param effect - The effect to check
   * @returns An array containing all attributes of the given type that exist on this item;
   * will be empty if none exist
   * @remarks
   * The order of the attributes within the returned array is unspecified and should not be relied upon.
   */
  private getAttrs<E extends Effects>(effect: E): readonly HeldItemAttr<E>[] {
    return (this.effects[effect] ?? []) as HeldItemAttr<E>[];
  }

  /**
   * Check whether this item handles the given effect at runtime.
   * Narrows the item's effect set to include `E`.
   * @param effect - The {@linkcode HeldItemEffect} to check
   * @returns Whether this item has at least 1 attribute for `effect`
   */
  public hasEffect<E extends HeldItemEffect>(effect: E): this is HeldItem<Effects | E> {
    return (this.effects as Record<HeldItemEffect, NonEmptyTuple<HeldItemAttr> | undefined>)[effect] != null;
  }

  /**
   * Apply all of this item's attributes that pertain to the given effect, subject to their individual
   * {@linkcode HeldItemAttr.shouldApply | shouldApply} conditions.
   * @param effect - The {@linkcode HeldItemEffect | effect} to apply
   * @param params - The parameters to pass to the item attributes' `apply` methods
   * @sealed
   */
  public apply<E extends Effects>(effect: E, params: HeldItemEffectParamMap[E]): void {
    for (const attr of this.getAttrs(effect)) {
      if (attr.shouldApply(params)) {
        attr.apply(params);
      }
    }
  }
}

// TODO: Make this a mixin to avoid diamond problem issues
/** Class for all {@linkcode HeldItem}s that can be consumed during battle. */
export class ConsumableHeldItem<Effects extends HeldItemEffect = HeldItemEffect> extends HeldItem<Effects> {
  /**
   * Consume this item and apply relevant effects.
   * Should be extended by any subclasses with their own on-consume effects.
   * @param pokemon - The Pokémon consuming the item
   * @param remove - Whether to remove the item during consumption; default `true`
   * @param unburden - Whether to trigger item loss abilities (i.e. Unburden)  when consuming the item; default `true`
   * @sealed
   */
  public consume(pokemon: Pokemon, remove = true, unburden = true): void {
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

/** Abstract class for all items that are purely cosmetic.
 * Currently coincides with the {@linkcode HeldItemBase} class.
 * Might become concrete later on if we want cosmetic items without a subclass. */
export abstract class CosmeticHeldItem extends HeldItemBase {
  /**
   * This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly differentiate cosmetic items from normal ones.
   */
  private declare _: never;
}
