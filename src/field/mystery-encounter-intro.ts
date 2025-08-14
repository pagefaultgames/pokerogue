import { globalScene } from "#app/global-scene";
import type { SpeciesId } from "#enums/species-id";
import { doShinySparkleAnim } from "#field/anims";
import { getSpriteKeysFromSpecies } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { loadPokemonVariantAssets } from "#sprites/pokemon-sprite";
import type { Variant } from "#sprites/variant";
import { isNullOrUndefined } from "#utils/common";
import console from "node:console";
import type { GameObjects } from "phaser";

type PlayAnimationConfig = Phaser.Types.Animations.PlayAnimationConfig;

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
  fileRoot: (KnownFileRoot & string) | string;
  /** Optional replacement for `spriteKey`/`fileRoot`. Just know this defaults to male/genderless, form 0, no shiny */
  species?: SpeciesId;
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
  /** If using a Pokemon shiny sprite, needs to be set to ensure the correct variant assets get loaded and displayed */
  isShiny?: boolean;
  /** If using a Pokemon shiny sprite, needs to be set to ensure the correct variant assets get loaded and displayed */
  variant?: Variant;
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
export class MysteryEncounterIntroVisuals extends Phaser.GameObjects.Container {
  public encounter: MysteryEncounter;
  public spriteConfigs: MysteryEncounterSpriteConfig[];
  public enterFromRight: boolean;
  private shinySparkleSprites: {
    sprite: Phaser.GameObjects.Sprite;
    variant: Variant;
  }[];

  // TODO: Refactor
  constructor(encounter: MysteryEncounter) {
    super(globalScene, -72, 76);
    this.encounter = encounter;
    this.enterFromRight = encounter.enterIntroVisualsFromRight ?? false;
    // Shallow copy configs to allow visual config updates at runtime without dirtying master copy of Encounter
    this.spriteConfigs = encounter.spriteConfigs.map(config => {
      const result = {
        ...config,
      };

      if (!isNullOrUndefined(result.species)) {
        const keys = getSpriteKeysFromSpecies(result.species, undefined, undefined, result.isShiny, result.variant);
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
      const ret = globalScene.addFieldSprite(0, 0, spriteKey);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: !!hasShadow,
        yShadowOffset: yShadow ?? 0,
      });
      return ret;
    };

    const getItemSprite = (spriteKey: string, hasShadow?: boolean, yShadow?: number) => {
      const icon = globalScene.add.sprite(-19, 2, "items", spriteKey);
      icon.setOrigin(0.5, 1);
      icon.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: !!hasShadow,
        yShadowOffset: yShadow ?? 0,
      });
      return icon;
    };

    // Depending on number of sprites added, should space them to be on the circular field sprite
    const minX = -40;
    const maxX = 40;
    const origin = 4;
    let n = 0;
    // Sprites with custom X or Y defined will not count for normal spacing requirements
    const spacingValue = Math.round((maxX - minX) / Math.max(this.spriteConfigs.filter(s => !s.x && !s.y).length, 1));

    this.shinySparkleSprites = [];
    const shinySparkleSprites = globalScene.add.container(0, 0);
    this.spriteConfigs?.forEach(config => {
      const { spriteKey, isItem, hasShadow, scale, x, y, yShadow, alpha, isPokemon, isShiny, variant } = config;

      let sprite: GameObjects.Sprite;
      let tintSprite: GameObjects.Sprite;
      let pokemonShinySparkle: Phaser.GameObjects.Sprite | undefined;

      if (isItem) {
        sprite = getItemSprite(spriteKey, hasShadow, yShadow);
        tintSprite = getItemSprite(spriteKey);
      } else {
        sprite = getSprite(spriteKey, hasShadow, yShadow);
        tintSprite = getSprite(spriteKey);
        if (isPokemon && isShiny) {
          // Set Pipeline for shiny variant
          sprite.setPipelineData("spriteKey", spriteKey);
          tintSprite.setPipelineData("spriteKey", spriteKey);
          sprite.setPipelineData("shiny", true);
          sprite.setPipelineData("variant", variant);
          tintSprite.setPipelineData("shiny", true);
          tintSprite.setPipelineData("variant", variant);
          // Create Sprite for shiny Sparkle
          pokemonShinySparkle = globalScene.add.sprite(sprite.x, sprite.y, "shiny");
          pokemonShinySparkle.setOrigin(0.5, 1);
          pokemonShinySparkle.setVisible(false);
          this.shinySparkleSprites.push({
            sprite: pokemonShinySparkle,
            variant: variant ?? 0,
          });
          shinySparkleSprites.add(pokemonShinySparkle);
        }
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
        // Single sprite
      } else if (this.spriteConfigs.length === 1) {
        sprite.x = origin;
        tintSprite.x = origin;
      } else {
        // Do standard sprite spacing (not including offset sprites)
        sprite.x = minX + (n + 0.5) * spacingValue + origin;
        tintSprite.x = minX + (n + 0.5) * spacingValue + origin;
        n++;
      }

      if (!isNullOrUndefined(pokemonShinySparkle)) {
        // Offset the sparkle to match the Pokemon's position
        pokemonShinySparkle.setPosition(sprite.x, sprite.y);
      }

      if (!isNullOrUndefined(alpha)) {
        sprite.setAlpha(alpha);
        tintSprite.setAlpha(alpha);
      }

      this.add(sprite);
      this.add(tintSprite);
    });
    this.add(shinySparkleSprites);
  }

  /**
   * Loads the assets that were defined on construction (async)
   */
  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      if (!this.spriteConfigs) {
        resolve();
      }

      const shinyPromises: Promise<void>[] = [];
      this.spriteConfigs.forEach(config => {
        if (config.isPokemon) {
          globalScene.loadPokemonAtlas(config.spriteKey, config.fileRoot);
          if (config.isShiny && !isNullOrUndefined(config.variant)) {
            shinyPromises.push(loadPokemonVariantAssets(config.spriteKey, config.fileRoot, config.variant));
          }
        } else if (config.isItem) {
          globalScene.loadAtlas("items", "");
        } else {
          globalScene.loadAtlas(config.spriteKey, config.fileRoot);
        }
      });

      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.spriteConfigs.every(config => {
          if (config.isItem) {
            return true;
          }

          const originalWarn = console.warn;

          // Ignore warnings for missing frames, because there will be a lot
          console.warn = () => {};
          const frameNames = globalScene.anims.generateFrameNames(config.spriteKey, {
            zeroPad: 4,
            suffix: ".png",
            start: 1,
            end: 128,
          });

          console.warn = originalWarn;
          if (!globalScene.anims.exists(config.spriteKey)) {
            globalScene.anims.create({
              key: config.spriteKey,
              frames: frameNames,
              frameRate: 10,
              repeat: -1,
            });
          }

          return true;
        });

        Promise.all(shinyPromises).then(() => resolve());
      });

      if (!globalScene.load.isLoading()) {
        globalScene.load.start();
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
        if (sprite.texture.frameTotal > 1) {
          // Show the first animation frame for a smooth transition when the animation starts.
          const firstFrame = sprite.texture.frames["0001.png"];
          sprite.setFrame(firstFrame ?? 0);
        }
      }
    });
    this.getTintSprites().map((tintSprite, i) => {
      if (!this.spriteConfigs[i].isItem) {
        tintSprite.setTexture(this.spriteConfigs[i].spriteKey).setFrame(0);
        if (tintSprite.texture.frameTotal > 1) {
          // Show the first frame for a smooth transition when the animation starts.
          const firstFrame = tintSprite.texture.frames["0001.png"];
          tintSprite.setFrame(firstFrame ?? 0);
        }
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
  tryPlaySprite(
    sprite: Phaser.GameObjects.Sprite,
    tintSprite: Phaser.GameObjects.Sprite,
    animConfig: Phaser.Types.Animations.PlayAnimationConfig,
  ): boolean {
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
   * Play shiny sparkle animations if there are shiny Pokemon
   */
  playShinySparkles() {
    for (const sparkleConfig of this.shinySparkleSprites) {
      globalScene.time.delayedCall(500, () => {
        doShinySparkleAnim(sparkleConfig.sprite, sparkleConfig.variant);
      });
    }
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
          startFrame: config?.startFrame ?? 0,
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
    this.spriteConfigs.forEach((_, i) => {
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
    this.spriteConfigs.forEach((_, i) => {
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
  private tint(sprite, color: number, alpha?: number, duration?: number, ease?: string): void {
    // const tintSprites = this.getTintSprites();
    sprite.setTintFill(color);
    sprite.setVisible(true);

    if (duration) {
      sprite.setAlpha(0);

      globalScene.tweens.add({
        targets: sprite,
        alpha: alpha || 1,
        duration,
        ease: ease || "Linear",
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
  tintAll(color: number, alpha?: number, duration?: number, ease?: string): void {
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
  private untint(sprite, duration: number, ease?: string): void {
    if (duration) {
      globalScene.tweens.add({
        targets: sprite,
        alpha: 0,
        duration,
        ease: ease || "Linear",
        onComplete: () => {
          sprite.setVisible(false);
          sprite.setAlpha(1);
        },
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
  untintAll(duration: number, ease?: string): void {
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
    for (const sprite of this.getSprites()) {
      sprite.setVisible(value);
    }
    return super.setVisible(value);
  }
}
