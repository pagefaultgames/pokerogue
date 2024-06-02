import BattleScene from "../battle-scene";
import MysteryEncounter from "../data/mystery-encounter";

export default class MysteryEncounterIntro extends Phaser.GameObjects.Container {
  public encounter: MysteryEncounter;
  public spriteKeys: string[];

  constructor(scene: BattleScene, encounter: MysteryEncounter, spriteKeys: string[]) {
    super(scene, -72, 76);
    this.encounter = encounter;
    this.spriteKeys = spriteKeys;

    const getSprite = (spriteKey: string, hasShadow?: boolean, forceFemale?: boolean) => {
      const ret = this.scene.addFieldSprite(0, 0, spriteKey);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], hasShadow: !!hasShadow });
      return ret;
    };

    //const spacingValue = Math.round(48 / Math.max(spriteKeys.length - 1, 1));
    const minX = -40;
    const maxX = 40;
    const origin = 4;
    const spacingValue = Math.round((maxX - minX) / Math.max(spriteKeys.length, 1));
    spriteKeys.forEach((key, i) => {
      const sprite = getSprite(key, true);
      const tintSprite = getSprite(key);

      tintSprite.setVisible(false);

      if (spriteKeys.length === 1) {
        sprite.x = origin;
        tintSprite.x = origin;
      } else {
        sprite.x = minX + (i + 0.5) * spacingValue + origin;
        tintSprite.x = minX + (i + 0.5) * spacingValue + origin;
      }

      this.add(sprite);
      this.add(tintSprite);
    });
  }

  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      this.spriteKeys.forEach((key) => {
        // TODO: map sprite key and folder together
        this.scene.loadAtlas(key, "trainer");
      });

      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.spriteKeys.forEach((key) => {
          const originalWarn = console.warn;

          // Ignore warnings for missing frames, because there will be a lot
          console.warn = () => {
          };
          const frameNames = this.scene.anims.generateFrameNames(key, { zeroPad: 4, suffix: ".png", start: 1, end: 128 });

          console.warn = originalWarn;
          if (!(this.scene.anims.exists(key))) {
            this.scene.anims.create({
              key: key,
              frames: frameNames,
              frameRate: 24,
              repeat: -1
            });
          }
        });

        resolve();
      });

      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    });
  }

  initSprite(): void {
    this.getSprites().map((sprite, i) => sprite.setTexture(this.spriteKeys[i]).setFrame(0));
    this.getTintSprites().map((tintSprite, i) => tintSprite.setTexture(this.spriteKeys[i]).setFrame(0));
  }

  /**
   * Attempts to animate a given set of {@linkcode Phaser.GameObjects.Sprite}
   * @see {@linkcode Phaser.GameObjects.Sprite.play}
   * @param sprite {@linkcode Phaser.GameObjects.Sprite} to animate
   * @param tintSprite {@linkcode Phaser.GameObjects.Sprite} placed on top of the sprite to add a color tint
   * @param animConfig {@linkcode Phaser.Types.Animations.PlayAnimationConfig} to pass to {@linkcode Phaser.GameObjects.Sprite.play}
   * @returns true if the sprite was able to be animated
   */
  tryPlaySprite(sprite: Phaser.GameObjects.Sprite, tintSprite: Phaser.GameObjects.Sprite, animConfig: Phaser.Types.Animations.PlayAnimationConfig): boolean {
    // Show an error in the console if there isn't a texture loaded
    if (sprite.texture.key === "__MISSING") {
      console.error(`No texture found for '${animConfig.key}'!`);

      return false;
    }
    // Don't try to play an animation when there isn't one
    if (sprite.texture.frameTotal <= 1) {
      console.warn(`No animation found for '${animConfig.key}'. Is this intentional?`);

      return false;
    }

    sprite.play(animConfig);
    tintSprite.play(animConfig);

    return true;
  }

  playAnim(): void {
    const sprites = this.getSprites();
    const tintSprites = this.getTintSprites();
    this.spriteKeys.forEach((key, i) => {
      const trainerAnimConfig = {
        key: key,
        repeat: 0,
        startFrame: 0
      };

      this.tryPlaySprite(sprites[i], tintSprites[i], trainerAnimConfig);
    });
  }

  getSprites(): Phaser.GameObjects.Sprite[] {
    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteKeys.forEach((key, i) => {
      ret.push(this.getAt(i * 2));
    });
    return ret;
  }

  getTintSprites(): Phaser.GameObjects.Sprite[] {
    //const ret: Phaser.GameObjects.Sprite[] = [
    //  this.getAt(1)
    //];
    //if (this.variant === TrainerVariant.DOUBLE && !this.config.doubleOnly) {
    //  ret.push(this.getAt(3));
    //}
    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteKeys.forEach((key, i) => {
      ret.push(this.getAt(i * 2 + 1));
    });

    return ret;
  }

  //tint(color: number, alpha?: number, duration?: integer, ease?: string): void {
  //  const tintSprites = this.getTintSprites();
  //  tintSprites.map(tintSprite => {
  //    tintSprite.setTintFill(color);
  //    tintSprite.setVisible(true);

  //    if (duration) {
  //      tintSprite.setAlpha(0);

  //      this.scene.tweens.add({
  //        targets: tintSprite,
  //        alpha: alpha || 1,
  //        duration: duration,
  //        ease: ease || "Linear"
  //      });
  //    } else {
  //      tintSprite.setAlpha(alpha);
  //    }
  //  });
  //}

  //untint(duration: integer, ease?: string): void {
  //  const tintSprites = this.getTintSprites();
  //  tintSprites.map(tintSprite => {
  //    if (duration) {
  //      this.scene.tweens.add({
  //        targets: tintSprite,
  //        alpha: 0,
  //        duration: duration,
  //        ease: ease || "Linear",
  //        onComplete: () => {
  //          tintSprite.setVisible(false);
  //          tintSprite.setAlpha(1);
  //        }
  //      });
  //    } else {
  //      tintSprite.setVisible(false);
  //      tintSprite.setAlpha(1);
  //    }
  //  });
  //}
}

export default interface MysteryEncounterIntro {
  scene: BattleScene
}
