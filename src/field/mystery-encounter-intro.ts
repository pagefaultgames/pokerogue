import { GameObjects } from "phaser";
import BattleScene from "../battle-scene";
import MysteryEncounter from "../data/mystery-encounters/mystery-encounter";

type KnownFileRoot =
  | "trainer"
  | "pokemon"
  | "arenas"
  | "battle_anims"
  | "cg"
  | "character"
  | "effect"
  | "egg"
  | "events"
  | "inputs"
  | "items"
  | "mystery-encounters"
  | "pokeball"
  | "pokemon"
  | "statuses"
  | "trainer"
  | "ui";

export class MysteryEncounterSpriteConfig {
  /** The sprite key (which is the image file name). e.g. "ace_trainer_f" */
  spriteKey: string;
  /** Refer to [/public/images](../../public/images) directorty for all folder names */
  fileRoot: KnownFileRoot & string;
  /** Enable shadow. Defaults to `false` */
  hasShadow?: boolean = false;
  /** Disable animation. Defaults to `false` */
  disableAnimation?: boolean = false;
  /** Depeat the animation. Defaults to `false` */
  repeat?: boolean = false;
  /** Tint color. `0` - `1`. Higher means darker tint. */
  tint?: number;
  /** X offset */
  x?: number;
  /** Y offset */
  y?: number;
  /** Sprite scale. `0` - `n` */
  scale?: number;
  /** If you are using an item sprite, set to `true` */
  isItem?: boolean;
  /** The sprites alpha. `0` - `1` The lower the number, the more transparent */
  alpha?: number;
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
    // Shallow copy configs to allow visual config updates at runtime without dirtying master copy of Encounter
    this.spriteConfigs = encounter.spriteConfigs.map(config => {
      return {
        ...config
      };
    });
    if (!this.spriteConfigs) {
      return;
    }

    const getSprite = (spriteKey: string, hasShadow?: boolean) => {
      const ret = this.scene.addFieldSprite(0, 0, spriteKey);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], hasShadow: !!hasShadow });
      return ret;
    };

    const getItemSprite = (spriteKey: string) => {
      const icon = this.scene.add.sprite(-19, 2, "items", spriteKey);
      icon.setOrigin(0.5, 1);
      return icon;
    };

    // Depending on number of sprites added, should space them to be on the circular field sprite
    const minX = -40;
    const maxX = 40;
    const origin = 4;
    let n = 0;
    // Sprites with custom X or Y defined will not count for normal spacing requirements
    const spacingValue = Math.round((maxX - minX) / Math.max(this.spriteConfigs.filter(s => !s.x && !s.y).length, 1));

    this.spriteConfigs?.forEach((config) => {
      let sprite: GameObjects.Sprite;
      let tintSprite: GameObjects.Sprite;
      if (!config.isItem) {
        sprite = getSprite(config.spriteKey, config.hasShadow);
        tintSprite = getSprite(config.spriteKey);
      } else {
        sprite = getItemSprite(config.spriteKey);
        tintSprite = getItemSprite(config.spriteKey);
      }

      tintSprite.setVisible(false);

      if (config.scale) {
        sprite.setScale(config.scale);
        tintSprite.setScale(config.scale);
      }

      // Sprite offset from origin
      if (config.x || config.y) {
        if (config.x) {
          sprite.setPosition(origin + config.x, sprite.y);
          tintSprite.setPosition(origin + config.x, tintSprite.y);
        }
        if (config.y) {
          sprite.setPosition(sprite.x, config.y);
          tintSprite.setPosition(tintSprite.x, config.y);
        }
      } else {
        // Single sprite
        if (this.spriteConfigs.length === 1) {
          sprite.x = origin;
          tintSprite.x = origin;
        } else {
          // Do standard sprite spacing (not including offset sprites)
          sprite.x = minX + (n + 0.5) * spacingValue + origin;
          tintSprite.x = minX + (n + 0.5) * spacingValue + origin;
          n++;
        }
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
        if (!config.isItem) {
          this.scene.loadAtlas(config.spriteKey, config.fileRoot);
        } else {
          this.scene.loadAtlas("items", "");
        }
      });

      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.spriteConfigs.every((config) => {
          if (config.isItem) {
            return true;
          }

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
              frameRate: 12,
              repeat: -1
            });
          }

          return true;
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

    this.getSprites().map((sprite, i) => {
      if (!this.spriteConfigs[i].isItem) {
        sprite.setTexture(this.spriteConfigs[i].spriteKey).setFrame(0);
      }
    });
    this.getTintSprites().map((tintSprite, i) => {
      if (!this.spriteConfigs[i].isItem) {
        tintSprite.setTexture(this.spriteConfigs[i].spriteKey).setFrame(0);
      }
    });

    this.spriteConfigs.every((config, i) => {
      if (!config.tint) {
        return true;
      }

      const tintSprite = this.getAt(i * 2 + 1);
      this.tint(tintSprite, 0, config.tint);

      return true;
    });
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
      if (!config.disableAnimation) {
        const trainerAnimConfig = {
          key: config.spriteKey,
          repeat: config?.repeat ? -1 : 0,
          startFrame: 0
        };

        this.tryPlaySprite(sprites[i], tintSprites[i], trainerAnimConfig);
      }
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

  tint(sprite, color: number, alpha?: number, duration?: integer, ease?: string): void {
    // const tintSprites = this.getTintSprites();
    sprite.setTintFill(color);
    sprite.setVisible(true);

    if (duration) {
      sprite.setAlpha(0);

      this.scene.tweens.add({
        targets: sprite,
        alpha: alpha || 1,
        duration: duration,
        ease: ease || "Linear"
      });
    } else {
      sprite.setAlpha(alpha);
    }
  }

  tintAll(color: number, alpha?: number, duration?: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      this.tint(tintSprite, color, alpha, duration, ease);
    });
  }

  untint(sprite, duration: integer, ease?: string): void {
    if (duration) {
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: duration,
        ease: ease || "Linear",
        onComplete: () => {
          sprite.setVisible(false);
          sprite.setAlpha(1);
        }
      });
    } else {
      sprite.setVisible(false);
      sprite.setAlpha(1);
    }
  }

  untintAll(duration: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      this.untint(tintSprite, duration, ease);
    });
  }
}

export default interface MysteryEncounterIntroVisuals {
  scene: BattleScene
}
