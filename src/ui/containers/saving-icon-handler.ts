import { globalScene } from "#app/global-scene";
import { fixedInt } from "#utils/common";

export class SavingIconHandler extends Phaser.GameObjects.Container {
  private icon: Phaser.GameObjects.Sprite;

  private animActive: boolean;
  private shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width - 4, globalScene.scaledCanvas.height - 4);
  }

  setup(): void {
    this.icon = globalScene.add.sprite(0, 0, "saving_icon");
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

    globalScene.tweens.add({
      targets: this,
      alpha: 1,
      duration: fixedInt(250),
      ease: "Sine.easeInOut",
      onComplete: () => {
        globalScene.time.delayedCall(fixedInt(500), () => {
          this.animActive = false;
          if (!this.shown) {
            this.hide();
          }
        });
      },
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

    globalScene.tweens.add({
      targets: this,
      alpha: 0,
      duration: fixedInt(250),
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.animActive = false;
        this.setVisible(false);
        if (this.shown) {
          this.show();
        }
      },
    });

    this.shown = false;
  }
}
