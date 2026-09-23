import { globalScene } from "#app/global-scene";
import { allHeldItems, allTrainerItems } from "#data/data-lists";
import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { TrainerItemManager } from "#items/trainer-item-manager";

const iconOverflowIndex = 24;

export class ItemBar extends Phaser.GameObjects.Container {
  private readonly player: boolean;
  private itemCache: (HeldItemId | TrainerItemId)[];
  public totalVisibleLength = 0;

  constructor(enemy?: boolean) {
    super(globalScene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  /**
   * Update the bar to include the provided trainer items and the items from each
   * provided Pokemon.
   * @param trainerItems - The {@linkcode TrainerItemManager} for the trainer to use
   * @param pokemonA - (Optional) The first Pokemon whose items should be drawn to the bar
   * @param pokemonB - (Optional) The second Pokemon whose items should be drawn to the bar
   */
  public updateItems(trainerItems: TrainerItemManager, pokemonA?: Pokemon, pokemonB?: Pokemon) {
    this.removeAll(true);

    const sortedTrainerItems = trainerItems.getItems().sort((a, b) => a - b);

    const heldItemsA = pokemonA ? pokemonA.getHeldItems().sort((a, b) => a - b) : [];
    const heldItemsB = pokemonB ? pokemonB.getHeldItems().sort((a, b) => a - b) : [];

    this.totalVisibleLength = sortedTrainerItems.length + heldItemsA.length + heldItemsB.length;

    let iconCount = 0;
    sortedTrainerItems.forEach(item => {
      const icon = allTrainerItems[item].createIcon(trainerItems.getStack(item));
      iconCount += 1;
      this.addIcon(icon, iconCount, allTrainerItems[item].name, allTrainerItems[item].description);
    });

    if (pokemonA) {
      heldItemsA.forEach(item => {
        const icon = allHeldItems[item].createPokemonIcon(pokemonA);
        iconCount += 1;
        this.addIcon(icon, iconCount, allHeldItems[item].name, allHeldItems[item].description);
      });
    }

    if (pokemonB) {
      heldItemsB.forEach(item => {
        const icon = allHeldItems[item].createPokemonIcon(pokemonB);
        iconCount += 1;
        this.addIcon(icon, iconCount, allHeldItems[item].name, allHeldItems[item].description);
      });
    }

    for (const icon of this.getAll()) {
      this.sendToBack(icon);
    }

    this.itemCache = [...sortedTrainerItems, ...heldItemsA, ...heldItemsB];
  }

  addIcon(icon: Phaser.GameObjects.Container, i: number, name: string, description: string) {
    if (i >= iconOverflowIndex) {
      icon.setVisible(false);
    }
    this.add(icon);
    this.setItemIconPosition(icon, this.totalVisibleLength);
    icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
    icon.on("pointerover", () => {
      globalScene.ui.showTooltip(name, description);
      if (this.itemCache && this.itemCache.length > iconOverflowIndex) {
        this.updateItemOverflowVisibility(true);
      }
    });
    icon.on("pointerout", () => {
      globalScene.ui.hideTooltip();
      if (this.itemCache && this.itemCache.length > iconOverflowIndex) {
        this.updateItemOverflowVisibility(false);
      }
    });
  }

  updateItemOverflowVisibility(ignoreLimit: boolean) {
    const itemIcons = this.getAll().reverse();
    for (const item of itemIcons.map(m => m as Phaser.GameObjects.Container).slice(iconOverflowIndex)) {
      item.setVisible(ignoreLimit);
    }
  }

  setItemIconPosition(icon: Phaser.GameObjects.Container, itemCount: number) {
    const rowIcons: number = 12 + 6 * Math.max(Math.ceil(Math.min(itemCount, 24) / 12) - 2, 0);

    const x = ((this.getIndex(icon) % rowIcons) * 26) / (rowIcons / 12);
    const y = Math.floor(this.getIndex(icon) / rowIcons) * 20;

    icon.setPosition(this.player ? x : -x, y);
  }
}
