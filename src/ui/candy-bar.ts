import BattleScene, { starterColors } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { argbFromRgba } from "@material/material-color-utilities";
import * as Utils from "../utils";
import { Species } from "#app/data/enums/species";

export default class CandyBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private candyIcon: Phaser.GameObjects.Sprite;
  private candyOverlayIcon: Phaser.GameObjects.Sprite;
  private countText: Phaser.GameObjects.Text;
  private speciesId: Species;

  private tween: Phaser.Tweens.Tween;
  private autoHideTimer: NodeJS.Timeout;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, (scene.game.canvas.width / 6), -((scene.game.canvas.height) / 6) + 15);
  }

  setup(): void {
    this.bg = this.scene.add.nineslice(0, 0, "party_exp_bar", null, 8, 18, 21, 5, 6, 4);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.candyIcon = this.scene.add.sprite(14, 0, "items", "candy");
    this.candyIcon.setOrigin(0.5, 0);
    this.candyIcon.setScale(0.5);

    this.add(this.candyIcon);

    this.candyOverlayIcon = this.scene.add.sprite(14, 0, "items", "candy_overlay");
    this.candyOverlayIcon.setOrigin(0.5, 0);
    this.candyOverlayIcon.setScale(0.5);

    this.add(this.candyOverlayIcon);

    this.countText = addTextObject(this.scene, 22, 4, "", TextStyle.BATTLE_INFO);
    this.countText.setOrigin(0, 0);
    this.add(this.countText);

    this.setVisible(false);
    this.shown = false;
  }

  showStarterSpeciesCandy(starterSpeciesId: Species, count: integer): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.shown) {
        if (this.speciesId === starterSpeciesId) {
          return resolve();
        } else {
          return this.hide().then(() => this.showStarterSpeciesCandy(starterSpeciesId, count)).then(() => resolve());
        }
      }

      const colorScheme = starterColors[starterSpeciesId];

      this.candyIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[0])));
      this.candyOverlayIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[1])));

      this.countText.setText(`${(this.scene as BattleScene).gameData.starterData[starterSpeciesId].candyCount + count} (+${count.toString()})`);

      this.bg.width = this.countText.displayWidth + 28;

      (this.scene as BattleScene).fieldUI.bringToTop(this);

      if (this.tween) {
        this.tween.stop();
      }

      (this.scene as BattleScene).playSound("shing");

      this.tween = this.scene.tweens.add({
        targets: this,
        x: (this.scene.game.canvas.width / 6) - (this.bg.width - 5),
        duration: 500,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tween = null;
          this.resetAutoHideTimer();
          resolve();
        }
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

      this.tween = this.scene.tweens.add({
        targets: this,
        x: (this.scene.game.canvas.width / 6),
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.tween = null;
          this.shown = false;
          this.setVisible(false);
          resolve();
        }
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
