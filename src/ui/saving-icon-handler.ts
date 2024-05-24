import BattleScene from "#app/battle-scene";
import * as Utils from "../utils";

export default class SavingIconHandler extends Phaser.GameObjects.Container {
  private icon: Phaser.GameObjects.Sprite;

  private animActive: boolean;
  private shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, scene.game.canvas.width / 6 - 4, scene.game.canvas.height / 6 - 4);
  }

  setup(): void {
    this.icon = this.scene.add.sprite(0, 0, "saving_icon");
    this.icon.setOrigin(1, 1);

    this.add(this.icon);

    this.animActive = false;
    this.shown = false;

    this.setAlpha(0);
    this.setVisible(false);
  }

  show(): void {
    this.shown = true;

    if (this.animActive) {
      return;
    }

    this.animActive = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: Utils.fixedInt(250),
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.scene.time.delayedCall(Utils.fixedInt(500), () => {
          this.animActive = false;
          if (!this.shown) {
            this.hide();
          }
        });
      }
    });

    this.setVisible(true);
    this.shown = true;
  }

  hide(): void {
    this.shown = false;

    if (this.animActive) {
      return;
    }

    this.animActive = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: Utils.fixedInt(250),
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.animActive = false;
        this.setVisible(false);
        if (this.shown) {
          this.show();
        }
      }
    });

    this.shown = false;
  }
}
