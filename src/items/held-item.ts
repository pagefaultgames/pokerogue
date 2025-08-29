import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import type { UniqueArray } from "#utils/common";
import i18next from "i18next";
import type { HeldItemEffectParamMap } from "./held-item-parameter";

export abstract class HeldItemBase {
  public type: HeldItemId;
  public readonly maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;
  }

  get name(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.name`);
  }

  get description(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.description`);
  }

  get iconName(): string {
    return `${HeldItemNames[this.type]?.toLowerCase()}`;
  }

  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114950716
  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createSummaryIcon(pokemon?: Pokemon, overrideStackCount?: number): Phaser.GameObjects.Container {
    const stackCount = overrideStackCount ?? (pokemon ? this.getStackCount(pokemon) : 0);

    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    container.setScale(0.5);

    return container;
  }

  createPokemonIcon(pokemon: Pokemon): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const pokemonIcon = globalScene.addPokemonIcon(pokemon, -2, 10, 0, 0.5, undefined, true);
    container.add(pokemonIcon);
    container.setName(pokemon.id.toString());

    const item = globalScene.add
      .sprite(16, 16, "items")
      .setScale(0.5)
      .setOrigin(0, 0.5)
      .setTexture("items", this.iconName);
    container.add(item);

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

    const text = globalScene.add.bitmapText(10, 15, "item-count", stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (stackCount >= this.getMaxStackCount()) {
      // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114955458
      text.setTint(0xf89890);
    }
    text.setOrigin(0);

    return text;
  }

  getStackCount(pokemon: Pokemon): number {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return stackCount;
  }

  getScoreMultiplier(): number {
    return 1;
  }

  untransferable(): this {
    this.isTransferable = false;
    return this;
  }

  unstealable(): this {
    this.isStealable = false;
    return this;
  }

  unsuppressable(): this {
    this.isSuppressable = false;
    return this;
  }
}

/** Tuple type containing >1 `HeldItemEffect`s */
export type EffectTuple = Readonly<[HeldItemEffect, ...HeldItemEffect[]]>;

/**
 * Abstract class for all non-cosmetic held items (i.e. ones that can have their effects applied).
 */
export abstract class HeldItem<T extends EffectTuple> extends HeldItemBase {
  /**
   * A readonly tuple containing all {@linkcode HeldItemEffect | effects} that this class can apply.
   * @privateRemarks
   * Please sort entries in ascending numerical order (for my sanity and yours)
   */
  abstract readonly effects: UniqueArray<T>;

  /**
   * Check whether a given effect of this item should apply.
   * @typeParam E - The type of one of this class' {@linkcode effects}
   * @param effect - The {@linkcode HeldItemEffect | effect} being applied
   * @param args - Arguments required for the effect application
   * @returns Whether the effect should apply.
   */
  shouldApply<E extends this["effects"][number]>(_effect: E, _args: HeldItemEffectParamMap[E]): boolean {
    return true;
  }

  /**
   * Apply the given item's effects.
   * Called if and only if {@linkcode shouldApply} returns `true`
   * @typeParam E - The type of one of this class' {@linkcode effects}
   * @param effect - The {@linkcode HeldItemEffect | effect} being applied
   * @param args - Arguments required for the effect application
   */
  abstract apply<E extends this["effects"][number]>(effect: E, param: HeldItemEffectParamMap[E]): void;
}

/** Abstract class for all `HeldItem`s that can be consumed during battle. */
export abstract class ConsumableHeldItem<T extends EffectTuple> extends HeldItem<T> {
  /**
   * Consume this item and apply relevant effects.
   * Should be overridden by any subclasses with their own on-consume effects.
   * @param pokemon - The {@linkcode Pokemon} consuming the item
   * @param remove - Whether to remove the item during consumption; default `true`
   * @param unburden - Whether to trigger item loss abilities (i.e. Unburden)  when consuming the item; default `true`
   */
  public consume(pokemon: Pokemon, remove = true, unburden = true): void {
    if (remove) {
      pokemon.heldItemManager.remove(this.type, 1);
      // TODO: Turn this into updateItemBar or something
      globalScene.updateItems(pokemon.isPlayer());
    }
    if (unburden) {
      applyAbAttrs("PostItemLostAbAttr", { pokemon: pokemon });
    }
  }
}
