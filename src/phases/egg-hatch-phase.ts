import type { AnySound } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { Egg } from "#data/egg";
import type { EggHatchData } from "#data/egg-hatch-data";
import { UiMode } from "#enums/ui-mode";
import { EggCountChangedEvent } from "#events/egg";
import { doShinySparkleAnim } from "#field/anims";
import type { PlayerPokemon } from "#field/pokemon";
import type { EggLapsePhase } from "#phases/egg-lapse-phase";
import { achvs } from "#system/achv";
import { EggCounterContainer } from "#ui/containers/egg-counter-container";
import { PokemonInfoContainer } from "#ui/containers/pokemon-info-container";
import type { EggHatchSceneHandler } from "#ui/handlers/egg-hatch-scene-handler";
import { fixedInt, getFrameMs, randInt } from "#utils/common";
import i18next from "i18next";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

/**
 * Class that represents egg hatching
 */
export class EggHatchPhase extends Phase {
  public readonly phaseName = "EggHatchPhase";
  /** The egg that is hatching */
  private egg: Egg;
  /** The new EggHatchData for the egg/pokemon that hatches */
  private eggHatchData: EggHatchData;

  /** The number of eggs that are hatching */
  private eggsToHatchCount: number;
  /** The container that lists how many eggs are hatching */
  private eggCounterContainer: EggCounterContainer;

  /** The scene handler for egg hatching */
  private eggHatchHandler: EggHatchSceneHandler;
  /** The phaser gameobject container that holds everything */
  private eggHatchContainer: Phaser.GameObjects.Container;
  /** The phaser image that is the background */
  private eggHatchBg: Phaser.GameObjects.Image;
  /** The phaser rectangle that overlays during the scene */
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;
  /** The phaser container that holds the egg */
  private eggContainer: Phaser.GameObjects.Container;
  /** The phaser sprite of the egg */
  private eggSprite: Phaser.GameObjects.Sprite;
  /** The phaser sprite of the cracks in an egg */
  private eggCrackSprite: Phaser.GameObjects.Sprite;
  /** The phaser sprite that represents the overlaid light rays */
  private eggLightraysOverlay: Phaser.GameObjects.Sprite;
  /** The phaser sprite of the hatched Pokemon */
  private pokemonSprite: Phaser.GameObjects.Sprite;
  /** The phaser sprite for shiny sparkles */
  private pokemonShinySparkle: Phaser.GameObjects.Sprite;

  /** The {@link PokemonInfoContainer} of the newly hatched Pokemon */
  private infoContainer: PokemonInfoContainer;

  /** The newly hatched {@link PlayerPokemon} */
  private pokemon: PlayerPokemon;
  /** The index of which egg move is unlocked. 0-2 is common, 3 is rare */
  private eggMoveIndex: number;
  /** Internal booleans representing if the egg is hatched, able to be skipped, or skipped */
  private hatched: boolean;
  private canSkip: boolean;
  private skipped: boolean;
  /** The sound effect being played when the egg is hatched */
  private evolutionBgm: AnySound | null;
  private eggLapsePhase: EggLapsePhase;

  constructor(hatchScene: EggLapsePhase, egg: Egg, eggsToHatchCount: number) {
    super();
    this.eggLapsePhase = hatchScene;
    this.egg = egg;
    this.eggsToHatchCount = eggsToHatchCount;
  }

  start() {
    super.start();

    globalScene.ui.setModeForceTransition(UiMode.EGG_HATCH_SCENE).then(() => {
      if (!this.egg) {
        return this.end();
      }

      const eggIndex = globalScene.gameData.eggs.findIndex(e => e.id === this.egg.id);

      if (eggIndex === -1) {
        return this.end();
      }

      globalScene.gameData.eggs.splice(eggIndex, 1);

      globalScene.fadeOutBgm(undefined, false);

      this.eggHatchHandler = globalScene.ui.getHandler() as EggHatchSceneHandler;

      this.eggHatchContainer = this.eggHatchHandler.eggHatchContainer;

      this.eggHatchBg = globalScene.add.image(0, 0, "default_bg");
      this.eggHatchBg.setOrigin(0, 0);
      this.eggHatchContainer.add(this.eggHatchBg);

      this.eggContainer = globalScene.add.container(
        this.eggHatchBg.displayWidth / 2,
        this.eggHatchBg.displayHeight / 2,
      );

      this.eggSprite = globalScene.add.sprite(0, 0, "egg", `egg_${this.egg.getKey()}`);
      this.eggCrackSprite = globalScene.add.sprite(0, 0, "egg_crack", "0");
      this.eggCrackSprite.setVisible(false);

      this.eggLightraysOverlay = globalScene.add.sprite(
        -this.eggHatchBg.displayWidth / 2 + 4,
        -this.eggHatchBg.displayHeight / 2,
        "egg_lightrays",
        "3",
      );
      this.eggLightraysOverlay.setOrigin(0, 0);
      this.eggLightraysOverlay.setVisible(false);

      this.eggContainer.add(this.eggSprite);
      this.eggContainer.add(this.eggCrackSprite);
      this.eggContainer.add(this.eggLightraysOverlay);
      this.eggHatchContainer.add(this.eggContainer);

      this.eggCounterContainer = new EggCounterContainer(this.eggsToHatchCount);
      this.eggHatchContainer.add(this.eggCounterContainer);

      const getPokemonSprite = () => {
        const ret = globalScene.add.sprite(
          this.eggHatchBg.displayWidth / 2,
          this.eggHatchBg.displayHeight / 2,
          "pkmn__sub",
        );
        ret.setPipeline(globalScene.spritePipeline, {
          tone: [0.0, 0.0, 0.0, 0.0],
          ignoreTimeTint: true,
        });
        return ret;
      };

      this.eggHatchContainer.add((this.pokemonSprite = getPokemonSprite()));

      this.pokemonShinySparkle = globalScene.add.sprite(this.pokemonSprite.x, this.pokemonSprite.y, "shiny");
      this.pokemonShinySparkle.setVisible(false);

      this.eggHatchContainer.add(this.pokemonShinySparkle);

      this.eggHatchOverlay = globalScene.add.rectangle(
        0,
        -globalScene.scaledCanvas.height,
        globalScene.scaledCanvas.width,
        globalScene.scaledCanvas.height,
        0xffffff,
      );
      this.eggHatchOverlay.setOrigin(0, 0);
      this.eggHatchOverlay.setAlpha(0);
      globalScene.fieldUI.add(this.eggHatchOverlay);

      this.infoContainer = new PokemonInfoContainer();
      this.infoContainer.setup();

      this.eggHatchContainer.add(this.infoContainer);

      // The game will try to unfuse any Pokemon even though eggs should not generate fused Pokemon in the first place
      const pokemon = this.generatePokemon();
      if (pokemon.fusionSpecies) {
        pokemon.clearFusionSpecies();
      }

      this.pokemonSprite.setVisible(false);

      this.pokemon = pokemon;

      pokemon.loadAssets().then(() => {
        this.canSkip = true;

        globalScene.time.delayedCall(1000, () => {
          if (!this.hatched) {
            this.evolutionBgm = globalScene.playSoundWithoutBgm("evolution");
          }
        });

        globalScene.time.delayedCall(2000, () => {
          if (this.hatched) {
            return;
          }
          this.eggCrackSprite.setVisible(true);
          this.doSpray(1, this.eggSprite.displayHeight / -2);
          this.doEggShake(2).then(() => {
            if (this.hatched) {
              return;
            }
            globalScene.time.delayedCall(1000, () => {
              if (this.hatched) {
                return;
              }
              this.doSpray(2, this.eggSprite.displayHeight / -4);
              this.eggCrackSprite.setFrame("1");
              globalScene.time.delayedCall(125, () => this.eggCrackSprite.setFrame("2"));
              this.doEggShake(4).then(() => {
                if (this.hatched) {
                  return;
                }
                globalScene.time.delayedCall(1000, () => {
                  if (this.hatched) {
                    return;
                  }
                  globalScene.playSound("se/egg_crack");
                  this.doSpray(4);
                  this.eggCrackSprite.setFrame("3");
                  globalScene.time.delayedCall(125, () => this.eggCrackSprite.setFrame("4"));
                  this.doEggShake(8, 2).then(() => {
                    if (!this.hatched) {
                      this.doHatch();
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  end() {
    if (globalScene.phaseManager.findPhase(p => p.is("EggHatchPhase"))) {
      this.eggHatchHandler.clear();
    } else {
      globalScene.time.delayedCall(250, () => globalScene.setModifiersVisible(true));
    }
    this.pokemon?.destroy();
    super.end();
  }

  /**
   * Function that animates egg shaking
   * @param intensity of horizontal shaking. Doubled on the first call (where count is 0)
   * @param repeatCount the number of times this function should be called (asynchronous recursion?!?)
   * @param count the current number of times this function has been called.
   * @returns nothing since it's a Promise<void>
   */
  doEggShake(intensity: number, repeatCount?: number, count?: number): Promise<void> {
    return new Promise(resolve => {
      if (repeatCount === undefined) {
        repeatCount = 0;
      }
      if (count === undefined) {
        count = 0;
      }
      globalScene.playSound("se/pb_move");
      globalScene.tweens.add({
        targets: this.eggContainer,
        x: `-=${intensity / (count ? 1 : 2)}`,
        ease: "Sine.easeInOut",
        duration: 125,
        onComplete: () => {
          globalScene.tweens.add({
            targets: this.eggContainer,
            x: `+=${intensity}`,
            ease: "Sine.easeInOut",
            duration: 250,
            onComplete: () => {
              count!++;
              if (count! < repeatCount!) {
                // we know they are defined
                return this.doEggShake(intensity, repeatCount, count).then(() => resolve());
              }
              globalScene.tweens.add({
                targets: this.eggContainer,
                x: `-=${intensity / 2}`,
                ease: "Sine.easeInOut",
                duration: 125,
                onComplete: () => resolve(),
              });
            },
          });
        },
      });
    });
  }

  /**
   * Tries to skip the hatching animation
   * @returns false if cannot be skipped or already skipped. True otherwise
   */
  trySkip(): boolean {
    if (!this.canSkip || this.skipped) {
      return false;
    }
    if (this.eggCounterContainer.eggCountText?.data === undefined) {
      return false;
    }
    this.skipped = true;
    if (!this.hatched) {
      this.doHatch();
    } else {
      this.doReveal();
    }
    return true;
  }

  /**
   * Plays the animation of an egg hatch
   */
  doHatch(): void {
    this.canSkip = false;
    this.hatched = true;
    if (this.evolutionBgm) {
      SoundFade.fadeOut(globalScene, this.evolutionBgm, fixedInt(100));
    }
    for (let e = 0; e < 5; e++) {
      globalScene.time.delayedCall(fixedInt(375 * e), () =>
        globalScene.playSound("se/egg_hatch", { volume: 1 - e * 0.2 }),
      );
    }
    this.eggLightraysOverlay.setVisible(true);
    this.eggLightraysOverlay.play("egg_lightrays");
    globalScene.tweens.add({
      duration: fixedInt(125),
      targets: this.eggHatchOverlay,
      alpha: 1,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.skipped = false;
        this.canSkip = true;
      },
    });
    globalScene.time.delayedCall(fixedInt(1500), () => {
      this.canSkip = false;
      if (!this.skipped) {
        this.doReveal();
      }
    });
  }

  /**
   * Function to do the logic and animation of completing a hatch and revealing the Pokemon
   */
  doReveal(): void {
    // set the previous dex data so info container can show new unlocks in egg summary
    const isShiny = this.pokemon.isShiny();
    if (this.pokemon.species.subLegendary) {
      globalScene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
    }
    if (this.pokemon.species.legendary) {
      globalScene.validateAchv(achvs.HATCH_LEGENDARY);
    }
    if (this.pokemon.species.mythical) {
      globalScene.validateAchv(achvs.HATCH_MYTHICAL);
    }
    if (isShiny) {
      globalScene.validateAchv(achvs.HATCH_SHINY);
    }
    this.eggContainer.setVisible(false);
    const spriteKey = this.pokemon.getSpriteKey(true);
    try {
      this.pokemonSprite.play(spriteKey);
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }
    this.pokemonSprite.setPipelineData("ignoreTimeTint", true);
    this.pokemonSprite.setPipelineData("spriteKey", this.pokemon.getSpriteKey());
    this.pokemonSprite.setPipelineData("shiny", this.pokemon.shiny);
    this.pokemonSprite.setPipelineData("variant", this.pokemon.variant);
    this.pokemonSprite.setVisible(true);
    globalScene.time.delayedCall(fixedInt(250), () => {
      this.eggsToHatchCount--;
      this.eggHatchHandler.eventTarget.dispatchEvent(new EggCountChangedEvent(this.eggsToHatchCount));
      this.pokemon.cry();
      if (isShiny) {
        globalScene.time.delayedCall(fixedInt(500), () => {
          doShinySparkleAnim(this.pokemonShinySparkle, this.pokemon.variant);
        });
      }
      globalScene.time.delayedCall(fixedInt(!this.skipped ? (!isShiny ? 1250 : 1750) : !isShiny ? 250 : 750), () => {
        this.infoContainer.show(this.pokemon, false, this.skipped ? 2 : 1);

        globalScene.playSoundWithoutBgm("evolution_fanfare");

        globalScene.ui.showText(
          i18next.t("egg:hatchFromTheEgg", {
            pokemonName: this.pokemon.species.getExpandedSpeciesName(),
          }),
          null,
          () => {
            globalScene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
            globalScene.gameData.setPokemonCaught(this.pokemon, true, true).then(() => {
              globalScene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex).then(value => {
                this.eggHatchData.setEggMoveUnlocked(value);
                globalScene.ui.showText("", 0);
                this.end();
              });
            });
          },
          null,
          true,
          3000,
        );
      });
    });
    globalScene.tweens.add({
      duration: fixedInt(this.skipped ? 500 : 3000),
      targets: this.eggHatchOverlay,
      alpha: 0,
      ease: "Cubic.easeOut",
    });
  }

  /**
   * Helper function to generate sine. (Why is this not a Utils?!?)
   * @param index random number from 0-7 being passed in to scale pi/128
   * @param amplitude Scaling
   * @returns a number
   */
  sin(index: number, amplitude: number): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  /**
   * Animates spraying
   * @param intensity number of times this is repeated (this is a badly named variable)
   * @param offsetY how much to offset the Y coordinates
   */
  doSpray(intensity: number, offsetY?: number) {
    globalScene.tweens.addCounter({
      repeat: intensity,
      duration: getFrameMs(1),
      onRepeat: () => {
        this.doSprayParticle(randInt(8), offsetY || 0);
      },
    });
  }

  /**
   * Animates a particle used in the spray animation
   * @param trigIndex Used to modify the particle's vertical speed, is a random number from 0-7
   * @param offsetY how much to offset the Y coordinate
   */
  doSprayParticle(trigIndex: number, offsetY: number) {
    const initialX = this.eggHatchBg.displayWidth / 2;
    const initialY = this.eggHatchBg.displayHeight / 2 + offsetY;
    const shardKey = !this.egg.isManaphyEgg() ? this.egg.tier.toString() : "1";
    const particle = globalScene.add.image(initialX, initialY, "egg_shard", `${shardKey}_${Math.floor(trigIndex / 2)}`);
    this.eggHatchContainer.add(particle);

    let f = 0;
    let yOffset = 0;
    const speed = 3 - randInt(8);
    const amp = 24 + randInt(32);

    const particleTimer = globalScene.tweens.addCounter({
      repeat: -1,
      duration: getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      },
    });

    const updateParticle = () => {
      const speedMultiplier = this.skipped ? 6 : 1;
      yOffset += speedMultiplier;
      if (trigIndex < 160) {
        particle.setPosition(initialX + (speed * f) / 3, initialY + yOffset);
        particle.y += -this.sin(trigIndex, amp);
        if (f > 108) {
          particle.setScale(1 - (f - 108) / 20);
        }
        trigIndex += 2 * speedMultiplier;
        f += speedMultiplier;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  /**
   * Generates a Pokemon to be hatched by the egg
   * Also stores the generated pokemon in this.eggHatchData
   * @returns the hatched PlayerPokemon
   */
  generatePokemon(): PlayerPokemon {
    this.eggHatchData = this.eggLapsePhase.generatePokemon(this.egg);
    this.eggMoveIndex = this.eggHatchData.eggMoveIndex;
    return this.eggHatchData.pokemon;
  }
}
