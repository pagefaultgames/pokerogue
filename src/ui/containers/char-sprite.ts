import { globalScene } from "#app/global-scene";
import { MissingTextureKey } from "#utils/common";

export class CharSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private transitionSprite: Phaser.GameObjects.Sprite;

  public key: string;
  public variant: string;
  public shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width + 32, -42);
  }

  setup(): void {
    [this.sprite, this.transitionSprite] = new Array(2).fill(null).map(() => {
      const ret = globalScene.add.sprite(0, 0, "", "");
      ret.setOrigin(0.5, 1);
      this.add(ret);
      return ret;
    });

    this.transitionSprite.setVisible(false);

    this.setVisible(false);
    this.shown = false;
  }

  showCharacter(key: string, variant: string): Promise<void> {
    return new Promise(resolve => {
      if (!key.startsWith("c_")) {
        key = `c_${key}`;
      }
      if (this.shown) {
        if (key === this.key && variant === this.variant) {
          return resolve();
        }
        if (key !== this.key) {
          return this.hide().then(() => this.showCharacter(key, variant));
        }
        this.setVariant(variant).then(() => resolve());
        return;
      }

      this.sprite.setTexture(key, variant);

      globalScene.fieldUI.bringToTop(this);

      globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width - 102,
        duration: 750,
        ease: "Cubic.easeOut",
        onComplete: () => {
          resolve();
        },
      });

      this.setVisible(globalScene.textures.get(key).key !== MissingTextureKey);
      this.shown = true;

      this.key = key;
      this.variant = variant;
    });
  }

  setVariant(variant: string): Promise<void> {
    return new Promise(resolve => {
      globalScene.fieldUI.bringToTop(this);

      this.transitionSprite.setTexture(this.key, variant);
      this.transitionSprite.setAlpha(0);
      this.transitionSprite.setVisible(true);
      globalScene.tweens.add({
        targets: this.transitionSprite,
        alpha: 1,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.sprite.setTexture(this.key, variant);
          this.transitionSprite.setVisible(false);
          resolve();
        },
      });
      this.variant = variant;
    });
  }

  hide(): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown) {
        return resolve();
      }

      globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width + 32,
        duration: 750,
        ease: "Cubic.easeIn",
        onComplete: () => {
          if (!this.shown) {
            this.setVisible(false);
          }
          resolve();
        },
      });

      this.shown = false;
    });
  }
}
