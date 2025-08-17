import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import type { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import { rgbHexToRgba } from "#utils/common";
import { argbFromRgba } from "@material/material-color-utilities";

export class CandyBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private candyIcon: Phaser.GameObjects.Sprite;
  private candyOverlayIcon: Phaser.GameObjects.Sprite;
  private countText: Phaser.GameObjects.Text;
  private speciesId: SpeciesId;

  private tween: Phaser.Tweens.Tween | null;
  private autoHideTimer: NodeJS.Timeout | null;

  public shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width, -globalScene.scaledCanvas.height + 15);
  }

  setup(): void {
    this.bg = globalScene.add.nineslice(0, 0, "party_exp_bar", undefined, 8, 18, 21, 5, 6, 4);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.candyIcon = globalScene.add.sprite(14, 0, "items", "candy");
    this.candyIcon.setOrigin(0.5, 0);
    this.candyIcon.setScale(0.5);

    this.add(this.candyIcon);

    this.candyOverlayIcon = globalScene.add.sprite(14, 0, "items", "candy_overlay");
    this.candyOverlayIcon.setOrigin(0.5, 0);
    this.candyOverlayIcon.setScale(0.5);

    this.add(this.candyOverlayIcon);

    this.countText = addTextObject(22, 4, "", TextStyle.BATTLE_INFO);
    this.countText.setOrigin(0, 0);
    this.add(this.countText);

    this.setVisible(false);
    this.shown = false;
  }

  showStarterSpeciesCandy(starterSpeciesId: SpeciesId, count: number): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.shown) {
        if (this.speciesId === starterSpeciesId) {
          return resolve();
        }
        return this.hide()
          .then(() => this.showStarterSpeciesCandy(starterSpeciesId, count))
          .then(() => resolve());
      }

      const colorScheme = starterColors[starterSpeciesId];

      this.candyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
      this.candyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));

      this.countText.setText(
        `${globalScene.gameData.starterData[starterSpeciesId].candyCount + count} (+${count.toString()})`,
      );

      this.bg.width = this.countText.displayWidth + 28;

      globalScene.fieldUI.bringToTop(this);

      if (this.tween) {
        this.tween.stop();
      }

      globalScene.playSound("se/shing");

      this.tween = globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width - (this.bg.width - 5),
        duration: 500,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tween = null;
          this.resetAutoHideTimer();
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

      if (this.autoHideTimer) {
        clearInterval(this.autoHideTimer);
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
          resolve();
        },
      });
    });
  }

  resetAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }
    this.autoHideTimer = setTimeout(() => {
      this.hide();
      this.autoHideTimer = null;
    }, 2500);
  }
}
