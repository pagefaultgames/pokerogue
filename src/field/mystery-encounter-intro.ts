import { GameObjects } from "phaser";
import BattleScene from "../battle-scene";
import MysteryEncounter from "../data/mystery-encounters/mystery-encounter";
import { Species } from "#enums/species";
import { isNullOrUndefined } from "#app/utils";
import { getSpriteKeysFromSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import PlayAnimationConfig = Phaser.Types.Animations.PlayAnimationConfig;

type KnownFileRoot =
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
  | "pokemon/back"
  | "pokemon/exp"
  | "pokemon/female"
  | "pokemon/icons"
  | "pokemon/input"
  | "pokemon/shiny"
  | "pokemon/variant"
  | "statuses"
  | "trainer"
  | "ui";

export class MysteryEncounterSpriteConfig {
  /** The sprite key (which is the image file name). e.g. "ace_trainer_f" */
  spriteKey: string;
  /** Refer to [/public/images](../../public/images) directorty for all folder names */
  fileRoot: KnownFileRoot & string | string;
  /** Optional replacement for `spriteKey`/`fileRoot`. Just know this defaults to male/genderless, form 0, no shiny */
  species?: Species;
  /** Enable shadow. Defaults to `false` */
  hasShadow?: boolean = false;
  /** Disable animation. Defaults to `false` */
  disableAnimation?: boolean = false;
  /** Repeat the animation. Defaults to `false` */
  repeat?: boolean = false;
  /** What frame of the animation to start on. Defaults to 0 */
  startFrame?: number = 0;
  /** Hidden at start of encounter. Defaults to `false` */
  hidden?: boolean = false;
  /** Tint color. `0` - `1`. Higher means darker tint. */
  tint?: number;
  /** X offset */
  x?: number;
  /** Y offset */
  y?: number;
  /** Y shadow offset */
  yShadow?: number;
  /** Sprite scale. `0` - `n` */
  scale?: number;
  /** If you are using a Pokemon sprite, set to `true`. This will ensure variant, form, gender, shiny sprites are loaded properly */
  isPokemon?: boolean;
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
  public enterFromRight: boolean;

  constructor(scene: BattleScene, encounter: MysteryEncounter) {
    super(scene, -72, 76);
    this.encounter = encounter;
    this.enterFromRight = encounter.enterIntroVisualsFromRight ?? false;
    // Shallow copy configs to allow visual config updates at runtime without dirtying master copy of Encounter
    this.spriteConfigs = encounter.spriteConfigs.map(config => {
      const result = {
        ...config
      };

      if (!isNullOrUndefined(result.species)) {
        const keys = getSpriteKeysFromSpecies(result.species);
        result.spriteKey = keys.spriteKey;
        result.fileRoot = keys.fileRoot;
        result.isPokemon = true;
      }

      return result;
    });
    if (!this.spriteConfigs) {
      return;
    }

    const getSprite = (spriteKey: string, hasShadow?: boolean, yShadow?: number) => {
      const ret = this.scene.addFieldSprite(0, 0, spriteKey);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], hasShadow: !!hasShadow, yShadowOffset: yShadow ?? 0 });
      return ret;
    };

    const getItemSprite = (spriteKey: string, hasShadow?: boolean, yShadow?: number) => {
      const icon = this.scene.add.sprite(-19, 2, "items", spriteKey);
      icon.setOrigin(0.5, 1);
      icon.setPipeline(this.scene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], hasShadow: !!hasShadow, yShadowOffset: yShadow ?? 0 });
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
      const { spriteKey, isItem, hasShadow, scale, x, y, yShadow, alpha } = config;

      let sprite: GameObjects.Sprite;
      let tintSprite: GameObjects.Sprite;

      if (!isItem) {
        sprite = getSprite(spriteKey, hasShadow, yShadow);
        tintSprite = getSprite(spriteKey);
      } else {
        sprite = getItemSprite(spriteKey, hasShadow, yShadow);
        tintSprite = getItemSprite(spriteKey);
      }

      sprite.setVisible(!config.hidden);
      tintSprite.setVisible(false);

      if (scale) {
        sprite.setScale(scale);
        tintSprite.setScale(scale);
      }

      // Sprite offset from origin
      if (x || y) {
        if (x) {
          sprite.setPosition(origin + x, sprite.y);
          tintSprite.setPosition(origin + x, tintSprite.y);
        }
        if (y) {
          sprite.setPosition(sprite.x, sprite.y + y);
          tintSprite.setPosition(tintSprite.x, tintSprite.y + y);
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

      if (!isNullOrUndefined(alpha)) {
        sprite.setAlpha(alpha);
        tintSprite.setAlpha(alpha);
      }

      this.add(sprite);
      this.add(tintSprite);
    });
  }

  /**
   * Loads the assets that were defined on construction (async)
   */
  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      if (!this.spriteConfigs) {
        resolve();
      }

      this.spriteConfigs.forEach((config) => {
        if (config.isPokemon) {
          this.scene.loadPokemonAtlas(config.spriteKey, config.fileRoot);
        } else if (config.isItem) {
          this.scene.loadAtlas("items", "");
        } else {
          this.scene.loadAtlas(config.spriteKey, config.fileRoot);
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

  /**
   * Sets the initial frames and tint of sprites after load
   */
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

  /**
   * For sprites with animation and that do not have animation disabled, will begin frame animation
   */
  playAnim(): void {
    if (!this.spriteConfigs) {
      return;
    }

    const sprites = this.getSprites();
    const tintSprites = this.getTintSprites();
    this.spriteConfigs.forEach((config, i) => {
      if (!config.disableAnimation) {
        const trainerAnimConfig: PlayAnimationConfig = {
          key: config.spriteKey,
          repeat: config?.repeat ? -1 : 0,
          startFrame: config?.startFrame ?? 0
        };

        this.tryPlaySprite(sprites[i], tintSprites[i], trainerAnimConfig);
      }
    });
  }

  /**
   * Returns a Sprite/TintSprite pair
   * @param index
   */
  getSpriteAtIndex(index: number): Phaser.GameObjects.Sprite[] {
    if (!this.spriteConfigs) {
      return [];
    }

    const ret: Phaser.GameObjects.Sprite[] = [];
    ret.push(this.getAt(index * 2)); // Sprite
    ret.push(this.getAt(index * 2 + 1)); // Tint Sprite

    return ret;
  }

  /**
   * Gets all non-tint sprites (these are the "real" unmodified sprites)
   */
  getSprites(): Phaser.GameObjects.Sprite[] {
    if (!this.spriteConfigs) {
      return [];
    }

    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteConfigs.forEach((config, i) => {
      ret.push(this.getAt(i * 2));
    });
    return ret;
  }

  /**
   * Gets all tint sprites (duplicate sprites that have different alpha and fill values)
   */
  getTintSprites(): Phaser.GameObjects.Sprite[] {
    if (!this.spriteConfigs) {
      return [];
    }

    const ret: Phaser.GameObjects.Sprite[] = [];
    this.spriteConfigs.forEach((config, i) => {
      ret.push(this.getAt(i * 2 + 1));
    });

    return ret;
  }

  /**
   * Tints a single sprite
   * @param sprite
   * @param color
   * @param alpha
   * @param duration
   * @param ease
   */
  private tint(sprite, color: number, alpha?: number, duration?: integer, ease?: string): void {
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

  /**
   * Tints all sprites
   * @param color
   * @param alpha
   * @param duration
   * @param ease
   */
  tintAll(color: number, alpha?: number, duration?: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      this.tint(tintSprite, color, alpha, duration, ease);
    });
  }

  /**
   * Untints a single sprite over a duration
   * @param sprite
   * @param duration
   * @param ease
   */
  private untint(sprite, duration: integer, ease?: string): void {
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

  /**
   * Untints all sprites
   * @param sprite
   * @param duration
   * @param ease
   */
  untintAll(duration: integer, ease?: string): void {
    const tintSprites = this.getTintSprites();
    tintSprites.map(tintSprite => {
      this.untint(tintSprite, duration, ease);
    });
  }

  /**
   * Sets container and all child sprites to visible
   * @param value - true for visible, false for hidden
   */
  setVisible(value: boolean): this {
    this.getSprites().forEach(sprite => {
      sprite.setVisible(value);
    });
    return super.setVisible(value);
  }
}

/**
 * Interface is required so as not to override {@link Phaser.GameObjects.Container.scene}
 */
export default interface MysteryEncounterIntroVisuals {
  scene: BattleScene
}
