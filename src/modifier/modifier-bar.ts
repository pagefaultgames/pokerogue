import { formChangeItemName } from "#app/data/pokemon-forms";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#app/items/all-held-items";
import type { FormChangeItem } from "#enums/form-change-item";
import type { HeldItemId } from "#enums/held-item-id";
import type { Modifier, PersistentModifier } from "./modifier";

const iconOverflowIndex = 24;

export const modifierSortFunc = (a: Modifier, b: Modifier): number => {
  const itemNameMatch = a.type.name.localeCompare(b.type.name);
  const typeNameMatch = a.constructor.name.localeCompare(b.constructor.name);

  //Then sort by item type
  if (typeNameMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return typeNameMatch;
};

//TODO: revisit this function
export const heldItemSortFunc = (a: HeldItemId, b: HeldItemId): number => {
  const itemNameMatch = allHeldItems[a].name.localeCompare(allHeldItems[b].name);
  const itemIdMatch = a - b;

  if (itemIdMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return itemIdMatch;
};

export const formChangeItemSortFunc = (a: FormChangeItem, b: FormChangeItem): number => {
  const nameA = formChangeItemName(a);
  const nameB = formChangeItemName(b);
  const itemNameMatch = nameA.localeCompare(nameB);
  const itemIdMatch = a - b;

  if (itemIdMatch === 0) {
    return itemNameMatch;
    //Finally sort by item name
  }
  return itemIdMatch;
};

export class ModifierBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private modifierCache: (PersistentModifier | HeldItemId)[];
  private totalVisibleLength = 0;

  constructor(enemy?: boolean) {
    super(globalScene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  /**
   * Method to update content displayed in {@linkcode ModifierBar}
   * @param {PersistentModifier[]} modifiers - The list of modifiers to be displayed in the {@linkcode ModifierBar}
   * @param {boolean} hideHeldItems - If set to "true", only modifiers not assigned to a Pokémon are displayed
   */
  updateModifiers(modifiers: PersistentModifier[], pokemonA: Pokemon, pokemonB?: Pokemon, hideHeldItems = false) {
    this.removeAll(true);

    const sortedVisibleModifiers = modifiers.filter(m => m.isIconVisible()).sort(modifierSortFunc);

    const heldItemsA = pokemonA.getHeldItems().sort(heldItemSortFunc);
    const heldItemsB = pokemonB ? pokemonB.getHeldItems().sort(heldItemSortFunc) : [];

    this.totalVisibleLength = sortedVisibleModifiers.length;
    if (!hideHeldItems) {
      this.totalVisibleLength += heldItemsA.length + heldItemsB.length;
    }

    sortedVisibleModifiers.forEach((modifier: PersistentModifier, i: number) => {
      const icon = modifier.getIcon();
      this.addIcon(icon, i, modifier.type.name, modifier.type.getDescription());
    });

    heldItemsA.forEach((item: HeldItemId, i: number) => {
      const icon = allHeldItems[item].createPokemonIcon(pokemonA);
      this.addIcon(icon, i, allHeldItems[item].name, allHeldItems[item].description);
    });

    heldItemsB.forEach((item: HeldItemId, i: number) => {
      const icon = allHeldItems[item].createPokemonIcon(pokemonB);
      this.addIcon(icon, i, allHeldItems[item].name, allHeldItems[item].description);
    });

    for (const icon of this.getAll()) {
      this.sendToBack(icon);
    }

    this.modifierCache = (modifiers as (PersistentModifier | HeldItemId)[]).concat(heldItemsA).concat(heldItemsB);
  }

  addIcon(icon: Phaser.GameObjects.Container, i: number, name: string, description: string) {
    if (i >= iconOverflowIndex) {
      icon.setVisible(false);
    }
    this.add(icon);
    this.setModifierIconPosition(icon, this.totalVisibleLength);
    icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
    icon.on("pointerover", () => {
      globalScene.ui.showTooltip(name, description);
      if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
        this.updateModifierOverflowVisibility(true);
      }
    });
    icon.on("pointerout", () => {
      globalScene.ui.hideTooltip();
      if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
        this.updateModifierOverflowVisibility(false);
      }
    });
  }

  updateModifierOverflowVisibility(ignoreLimit: boolean) {
    const modifierIcons = this.getAll().reverse();
    for (const modifier of modifierIcons.map(m => m as Phaser.GameObjects.Container).slice(iconOverflowIndex)) {
      modifier.setVisible(ignoreLimit);
    }
  }

  setModifierIconPosition(icon: Phaser.GameObjects.Container, modifierCount: number) {
    const rowIcons: number = 12 + 6 * Math.max(Math.ceil(Math.min(modifierCount, 24) / 12) - 2, 0);

    const x = ((this.getIndex(icon) % rowIcons) * 26) / (rowIcons / 12);
    const y = Math.floor(this.getIndex(icon) / rowIcons) * 20;

    icon.setPosition(this.player ? x : -x, y);
  }
}
