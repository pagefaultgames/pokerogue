import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { type HeldItemId, HeldItemNames } from "#enums/held-item-id";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

export abstract class HeldItem {
  //  public pokemonId: number;
  // TODO: Make this abstract
  public readonly type: HeldItemId;
  public readonly maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  //TODO: If this is actually never changed by any subclass, perhaps it should not be here
  public soundName = "se/restore";

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;
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

  // TODO: Aren't these fine as just properties to set in the subclass definition?
  untransferable(): HeldItem {
    this.isTransferable = false;
    return this;
  }

  unstealable(): HeldItem {
    this.isStealable = false;
    return this;
  }

  unsuppressable(): HeldItem {
    this.isSuppressable = false;
    return this;
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

  // TODO: Split off all held items with `apply` methods into their own class
}

export class ConsumableHeldItem extends HeldItem {
  // Sometimes berries are not eaten, some stuff may not proc unburden...
  consume(pokemon: Pokemon, isPlayer: boolean, remove = true, unburden = true): void {
    if (remove) {
      pokemon.heldItemManager.remove(this.type, 1);
      // TODO: Turn this into updateItemBar or something
      globalScene.updateItems(isPlayer);
    }
    if (unburden) {
      applyAbAttrs("PostItemLostAbAttr", { pokemon: pokemon });
    }
  }
}
