import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import type { Pokemon } from "#field/pokemon";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class PartyExpBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private pokemonIcon: Phaser.GameObjects.Container;
  private expText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween | null;

  public shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width, -globalScene.scaledCanvas.height + 15);
  }

  setup(): void {
    this.bg = globalScene.add.nineslice(0, 0, "party_exp_bar", undefined, 8, 18, 21, 5, 6, 4);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.expText = addTextObject(22, 4, "", TextStyle.BATTLE_INFO);
    this.expText.setOrigin(0, 0);
    this.add(this.expText);

    this.setVisible(false);
    this.shown = false;
  }

  showPokemonExp(pokemon: Pokemon, expValue: number, showOnlyLevelUp: boolean, newLevel: number): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.shown) {
        return resolve();
      }

      this.pokemonIcon = globalScene.addPokemonIcon(pokemon, -8, 15, 0, 0.5);
      this.pokemonIcon.setScale(0.5);

      this.add(this.pokemonIcon);

      // if we want to only display the level in the small frame
      if (showOnlyLevelUp) {
        if (newLevel > 200) {
          // if the level is greater than 200, we only display Lv. UP
          this.expText.setText(i18next.t("battleScene:levelUp"));
        } else {
          // otherwise we display Lv. Up and the new level
          this.expText.setText(i18next.t("battleScene:levelUpWithLevel", { level: newLevel }));
        }
      } else {
        // if we want to display the exp
        this.expText.setText(`+${expValue.toString()}`);
      }

      this.bg.width = this.expText.displayWidth + 28;

      globalScene.fieldUI.bringToTop(this);

      if (this.tween) {
        this.tween.stop();
      }

      this.tween = globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width - (this.bg.width - 5),
        duration: 500 / Math.pow(2, globalScene.expGainsSpeed),
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tween = null;
          resolve();
        },
      });

      this.setVisible(true);
      this.shown = true;
    });
  }

  hide(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.shown) {
        return resolve();
      }

      if (this.tween) {
        this.tween.stop();
      }

      this.tween = globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width,
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.tween = null;
          this.shown = false;
          this.setVisible(false);
          this.pokemonIcon?.destroy();
          resolve();
        },
      });
    });
  }
}
