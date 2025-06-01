import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { HeldItems } from "#enums/held-items";

export class HeldItem {
  //  public pokemonId: number;
  public type: HeldItems;
  public maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  constructor(type: HeldItems, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;
  }

  get name(): string {
    return "";
  }

  get description(): string {
    return "";
  }

  get iconName(): string {
    return "";
  }

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

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createSummaryIcon(stackCount: number): Phaser.GameObjects.Container {
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

  createPokemonIcon(stackCount: number, pokemon: Pokemon): Phaser.GameObjects.Container {
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

    const stackText = this.getIconStackText(stackCount);
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
      text.setTint(0xf89890);
    }
    text.setOrigin(0);

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

export class ConsumableHeldItem extends HeldItem {
  applyConsumable(_pokemon: Pokemon): boolean {
    return true;
  }

  apply(pokemon: Pokemon): boolean {
    const consumed = this.applyConsumable(pokemon);

    if (consumed) {
      pokemon.heldItemManager.remove(this.type, 1);
      return true;
    }

    return false;
  }
}
