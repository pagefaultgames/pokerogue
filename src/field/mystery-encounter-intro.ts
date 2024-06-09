import BattleScene from "../battle-scene";
import MysteryEncounter from "../data/mystery-encounter";

export class MysteryEncounterSpriteConfig {
  spriteKey: string; // e.g. "ace_trainer_f"
  fileRoot: string; // "trainer" for trainer sprites, "pokemon" for pokemon, etc. Refer to /public/images directory for the folder name
  hasShadow?: boolean = false; // Spawns shadow underneath sprite
  repeat?: boolean = false; // Cycles animation
  useSilhouette?: boolean = false;
}

/**
 * When a mystery encounter spawns, there are visuals (mainly sprites) tied to the field for the new encounter to inform the player of the type of encounter
 * These slide in with the field as part of standard field change cycle, and will typically be hidden after the player has selected an option for the encounter
 * Note: intro visuals are not "Trainers" or any other specific game object, though they may contain trainer sprites
 */
export default class MysteryEncounterIntroVisuals extends Phaser.GameObjects.Container {
  public encounter: MysteryEncounter;
  public spriteConfigs: MysteryEncounterSpriteConfig[];

  constructor(scene: BattleScene, encounter: MysteryEncounter) {
    super(scene, -72, 76);
    this.encounter = encounter;
    this.spriteConfigs = encounter.spriteConfigs;
    if (!this.spriteConfigs) {
      return;
    }

    const getSprite = (spriteKey: string, hasShadow?: boolean) => {
      const ret = this.scene.addFieldSprite(0, 0, spriteKey);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], hasShadow: !!hasShadow });
      return ret;
    };

    // Depending on number of sprites added, should space them to be on the circular field sprite
    const minX = -40;
    const maxX = 40;
    const origin = 4;
    const spacingValue = Math.round((maxX - minX) / Math.max(this.spriteConfigs.length, 1));
    this.spriteConfigs.forEach((config, i) => {
      const sprite = getSprite(config.spriteKey, true);
      const tintSprite = getSprite(config.spriteKey);

      tintSprite.setVisible(false);

      if (this.spriteConfigs.length === 1) {
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
      if (!this.spriteConfigs) {
        resolve();
      }

      this.spriteConfigs.forEach((config) => {
        this.scene.loadAtlas(config.spriteKey, config.fileRoot);
      });

      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.spriteConfigs.forEach((config) => {
          const originalWarn = console.warn;

          // Ignore warnings for missing frames, because there will be a lot
          console.warn = () => {
          };
          const frameNames = this.scene.anims.generateFrameNames(config.spriteKey, { zeroPad: 4, suffix: ".png", start: 1, end: 128 });

          console.warn = originalWarn;
          if (!(this.scene.anims.exists(config.spriteKey))) {
            this.scene.anims.create({
              key: config.spriteKey,
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
    if (!this.spriteConfigs) {
      return;
    }

    this.getSprites().map((sprite, i) => sprite.setTexture(this.spriteConfigs[i].spriteKey).setFrame(0));
    this.getTintSprites().map((tintSprite, i) => tintSprite.setTexture(this.spriteConfigs[i].spriteKey).setFrame(0));

    if (this.spriteConfigs.some(config => config.useSilhouette)) {
      this.tint(0, 1);
    }
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
    if (!this.spriteConfigs) {
      return;
    }

    const sprites = this.getSprites();
    const tintSprites = this.getTintSprites();
    this.spriteConfigs.forEach((config, i) => {
      const trainerAnimConfig = {
        key: config.spriteKey,
        repeat: config?.repeat ? -1 : 0,
        startFrame: 0
      };

      this.tryPlaySprite(sprites[i], tintSprites[i], trainerAnimConfig);
    });
  }

  getSprites(): Phaser.GameObjects.Sprite[] {
    if (!this.spriteConfigs) {
      return;
    }

    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteConfigs.forEach((config, i) => {
      ret.push(this.getAt(i * 2));
    });
    return ret;
  }

  getTintSprites(): Phaser.GameObjects.Sprite[] {
    if (!this.spriteConfigs) {
      return;
    }

    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteConfigs.forEach((config, i) => {
      ret.push(this.getAt(i * 2 + 1));
    });

    return ret;
  }

  tint(color: number, alpha?: number, duration?: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      tintSprite.setTintFill(color);
      tintSprite.setVisible(true);

      if (duration) {
        tintSprite.setAlpha(0);

        this.scene.tweens.add({
          targets: tintSprite,
          alpha: alpha || 1,
          duration: duration,
          ease: ease || "Linear"
        });
      } else {
        tintSprite.setAlpha(alpha);
      }
    });
  }

  untint(duration: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      if (duration) {
        this.scene.tweens.add({
          targets: tintSprite,
          alpha: 0,
          duration: duration,
          ease: ease || "Linear",
          onComplete: () => {
            tintSprite.setVisible(false);
            tintSprite.setAlpha(1);
          }
        });
      } else {
        tintSprite.setVisible(false);
        tintSprite.setAlpha(1);
      }
    });
  }
}

export default interface MysteryEncounterIntroVisuals {
  scene: BattleScene
}
