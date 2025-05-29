import { globalScene } from "#app/global-scene";
import { modifierSortFunc, type PokemonHeldItemModifier } from "./held-item-modifier";
import type { PersistentModifier } from "./modifier";

const iconOverflowIndex = 24;

export class ModifierBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private modifierCache: PersistentModifier[];

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
  updateModifiers(modifiers: PersistentModifier[], hideHeldItems = false) {
    this.removeAll(true);

    const visibleIconModifiers = modifiers.filter(m => m.isIconVisible());
    const nonPokemonSpecificModifiers = visibleIconModifiers
      .filter(m => !(m as PokemonHeldItemModifier).pokemonId)
      .sort(modifierSortFunc);
    const pokemonSpecificModifiers = visibleIconModifiers
      .filter(m => (m as PokemonHeldItemModifier).pokemonId)
      .sort(modifierSortFunc);

    const sortedVisibleIconModifiers = hideHeldItems
      ? nonPokemonSpecificModifiers
      : nonPokemonSpecificModifiers.concat(pokemonSpecificModifiers);

    sortedVisibleIconModifiers.forEach((modifier: PersistentModifier, i: number) => {
      const icon = modifier.getIcon();
      if (i >= iconOverflowIndex) {
        icon.setVisible(false);
      }
      this.add(icon);
      this.setModifierIconPosition(icon, sortedVisibleIconModifiers.length);
      icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
      icon.on("pointerover", () => {
        globalScene.ui.showTooltip(modifier.type.name, modifier.type.getDescription());
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
    });

    for (const icon of this.getAll()) {
      this.sendToBack(icon);
    }

    this.modifierCache = modifiers;
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
