import { globalScene } from "#app/global-scene";
import { allHeldItems, allTrainerItems } from "#data/data-lists";
import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import { heldItemSortFunc, trainerItemSortFunc } from "#items/item-utility";
import type { TrainerItemManager } from "#items/trainer-item-manager";

const iconOverflowIndex = 24;

export class ItemBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private itemCache: (HeldItemId | TrainerItemId)[];
  public totalVisibleLength = 0;

  constructor(enemy?: boolean) {
    super(globalScene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  /**
   * Method to update content displayed in {@linkcode ItemBar}
   * @param {PersistentItem[]} items - The list of items to be displayed in the {@linkcode ItemBar}
   * @param {boolean} hideHeldItems - If set to "true", only items not assigned to a Pokémon are displayed
   */
  updateItems(trainerItems: TrainerItemManager, pokemonA?: Pokemon, pokemonB?: Pokemon) {
    this.removeAll(true);

    const sortedTrainerItems = trainerItems.getTrainerItems().sort(trainerItemSortFunc);

    const heldItemsA = pokemonA ? pokemonA.getHeldItems().sort(heldItemSortFunc) : [];
    const heldItemsB = pokemonB ? pokemonB.getHeldItems().sort(heldItemSortFunc) : [];

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

    this.itemCache = ([] as (TrainerItemId | HeldItemId)[])
      .concat(sortedTrainerItems)
      .concat(heldItemsA)
      .concat(heldItemsB);
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
