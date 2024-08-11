import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import i18next from "i18next";
import { Phase } from "./phase";
import BattleScene, { AnySound } from "./battle-scene";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { EGG_SEED, Egg } from "./data/egg";
import EggHatchSceneHandler from "./ui/egg-hatch-scene-handler";
import { PlayerPokemon } from "./field/pokemon";
import { achvs } from "./system/achv";
import PokemonInfoContainer from "./ui/pokemon-info-container";
import EggCounterContainer from "./ui/egg-counter-container";
import { EggCountChangedEvent } from "./events/egg";
import { getPokemonNameWithAffix } from "./messages";
import { DexEntry, StarterDataEntry } from "./system/game-data";

// export class EggSkipPhase extends Phase {
//   private eggs: Egg[];


//   constructor(scene: BattleScene, eggs: Egg[], pokemonHatchedContainer: PlayerPokemon[]) {
//     super(scene);

//     this.eggs = eggs;
//     this.newEggMoves = [];
//     this.eggsToHatchCount = eggs.length;
//     this.pokemonHatched = pokemonHatchedContainer;
//   }

//   start() {

//   }




//   end() {
//     super.end();
//   }
// }


/**
 * Class that represents egg hatching
 */
export class EggHatchPhase extends Phase {
  /** The egg that is hatching */
  private egg: Egg;
  private eggHatchData: EggHatchData;
  private eggHatchDataContainer: EggHatchData[];

  /** The number of eggs that are hatching */
  private eggsToHatchCount: integer;
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
  private eggMoveIndex: integer;
  /** Internal booleans representing if the egg is hatched, able to be skipped, or skipped */
  private hatched: boolean;
  private canSkip: boolean;
  private skipped: boolean;
  /** The sound effect being played when the egg is hatched */
  private evolutionBgm: AnySound;

  constructor(scene: BattleScene, egg: Egg, eggHatchDataContainer: EggHatchData[], eggsToHatchCount: integer) {
    super(scene);

    this.egg = egg;
    this.eggsToHatchCount = eggsToHatchCount;
    this.eggHatchDataContainer = eggHatchDataContainer;
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SCENE).then(() => {

      if (!this.egg) {
        return this.end();
      }

      const eggIndex = this.scene.gameData.eggs.findIndex(e => e.id === this.egg.id);

      if (eggIndex === -1) {
        return this.end();
      }

      this.scene.gameData.eggs.splice(eggIndex, 1);

      this.scene.fadeOutBgm(null, false);

      this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

      this.eggHatchContainer = this.eggHatchHandler.eggHatchContainer;

      this.eggHatchBg = this.scene.add.image(0, 0, "default_bg");
      this.eggHatchBg.setOrigin(0, 0);
      this.eggHatchContainer.add(this.eggHatchBg);

      this.eggContainer = this.scene.add.container(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2);

      this.eggSprite = this.scene.add.sprite(0, 0, "egg", `egg_${this.egg.getKey()}`);
      this.eggCrackSprite = this.scene.add.sprite(0, 0, "egg_crack", "0");
      this.eggCrackSprite.setVisible(false);

      this.eggLightraysOverlay = this.scene.add.sprite((-this.eggHatchBg.displayWidth / 2) + 4, -this.eggHatchBg.displayHeight / 2, "egg_lightrays", "3");
      this.eggLightraysOverlay.setOrigin(0, 0);
      this.eggLightraysOverlay.setVisible(false);

      this.eggContainer.add(this.eggSprite);
      this.eggContainer.add(this.eggCrackSprite);
      this.eggContainer.add(this.eggLightraysOverlay);
      this.eggHatchContainer.add(this.eggContainer);

      this.eggCounterContainer = new EggCounterContainer(this.scene, this.eggsToHatchCount);
      this.eggHatchContainer.add(this.eggCounterContainer);

      const getPokemonSprite = () => {
        const ret = this.scene.add.sprite(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2, "pkmn__sub");
        ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
        return ret;
      };

      this.eggHatchContainer.add((this.pokemonSprite = getPokemonSprite()));

      this.pokemonShinySparkle = this.scene.add.sprite(this.pokemonSprite.x, this.pokemonSprite.y, "shiny");
      this.pokemonShinySparkle.setVisible(false);

      this.eggHatchContainer.add(this.pokemonShinySparkle);

      this.eggHatchOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0xFFFFFF);
      this.eggHatchOverlay.setOrigin(0, 0);
      this.eggHatchOverlay.setAlpha(0);
      this.scene.fieldUI.add(this.eggHatchOverlay);

      this.infoContainer = new PokemonInfoContainer(this.scene);
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

        this.scene.time.delayedCall(1000, () => {
          if (!this.hatched) {
            this.evolutionBgm = this.scene.playSoundWithoutBgm("evolution");
          }
        });

        this.scene.time.delayedCall(2000, () => {
          if (this.hatched) {
            return;
          }
          this.eggCrackSprite.setVisible(true);
          this.doSpray(1, this.eggSprite.displayHeight / -2);
          this.doEggShake(2).then(() => {
            if (this.hatched) {
              return;
            }
            this.scene.time.delayedCall(1000, () => {
              if (this.hatched) {
                return;
              }
              this.doSpray(2, this.eggSprite.displayHeight / -4);
              this.eggCrackSprite.setFrame("1");
              this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame("2"));
              this.doEggShake(4).then(() => {
                if (this.hatched) {
                  return;
                }
                this.scene.time.delayedCall(1000, () => {
                  if (this.hatched) {
                    return;
                  }
                  this.scene.playSound("egg_crack");
                  this.doSpray(4);
                  this.eggCrackSprite.setFrame("3");
                  this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame("4"));
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
    this.eggHatchDataContainer.push(this.eggHatchData);
    if (this.scene.findPhase((p) => p instanceof EggHatchPhase)) {
      this.eggHatchHandler.clear();
    } else {
      this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    }
    super.end();
  }

  /**
   * Function that animates egg shaking
   * @param intensity of horizontal shaking. Doubled on the first call (where count is 0)
   * @param repeatCount the number of times this function should be called (asynchronous recursion?!?)
   * @param count the current number of times this function has been called.
   * @returns nothing since it's a Promise<void>
   */
  doEggShake(intensity: number, repeatCount?: integer, count?: integer): Promise<void> {
    return new Promise(resolve => {
      if (repeatCount === undefined) {
        repeatCount = 0;
      }
      if (count === undefined) {
        count = 0;
      }
      this.scene.playSound("pb_move");
      this.scene.tweens.add({
        targets: this.eggContainer,
        x: `-=${intensity / (count ? 1 : 2)}`,
        ease: "Sine.easeInOut",
        duration: 125,
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.eggContainer,
            x: `+=${intensity}`,
            ease: "Sine.easeInOut",
            duration: 250,
            onComplete: () => {
              count++;
              if (count < repeatCount) {
                return this.doEggShake(intensity, repeatCount, count).then(() => resolve());
              }
              this.scene.tweens.add({
                targets: this.eggContainer,
                x: `-=${intensity / 2}`,
                ease: "Sine.easeInOut",
                duration: 125,
                onComplete: () => resolve()
              });
            }
          });
        }
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
      SoundFade.fadeOut(this.scene, this.evolutionBgm, Utils.fixedInt(100));
    }
    for (let e = 0; e < 5; e++) {
      this.scene.time.delayedCall(Utils.fixedInt(375 * e), () => this.scene.playSound("egg_hatch", { volume: 1 - (e * 0.2) }));
    }
    this.eggLightraysOverlay.setVisible(true);
    this.eggLightraysOverlay.play("egg_lightrays");
    this.scene.tweens.add({
      duration: Utils.fixedInt(125),
      targets: this.eggHatchOverlay,
      alpha: 1,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.skipped = false;
        this.canSkip = true;
      }
    });
    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
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
    this.eggHatchData.setDex();
    const isShiny = this.pokemon.isShiny();
    if (this.pokemon.species.subLegendary) {
      this.scene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
    }
    if (this.pokemon.species.legendary) {
      this.scene.validateAchv(achvs.HATCH_LEGENDARY);
    }
    if (this.pokemon.species.mythical) {
      this.scene.validateAchv(achvs.HATCH_MYTHICAL);
    }
    if (isShiny) {
      this.scene.validateAchv(achvs.HATCH_SHINY);
    }
    this.eggContainer.setVisible(false);
    this.pokemonSprite.play(this.pokemon.getSpriteKey(true));
    this.pokemonSprite.setPipelineData("ignoreTimeTint", true);
    this.pokemonSprite.setPipelineData("spriteKey", this.pokemon.getSpriteKey());
    this.pokemonSprite.setPipelineData("shiny", this.pokemon.shiny);
    this.pokemonSprite.setPipelineData("variant", this.pokemon.variant);
    this.pokemonSprite.setVisible(true);
    this.scene.time.delayedCall(Utils.fixedInt(250), () => {
      this.eggsToHatchCount--;
      this.eggHatchHandler.eventTarget.dispatchEvent(new EggCountChangedEvent(this.eggsToHatchCount));
      this.pokemon.cry();
      if (isShiny) {
        this.scene.time.delayedCall(Utils.fixedInt(500), () => {
          this.pokemonShinySparkle.play(`sparkle${this.pokemon.variant ? `_${this.pokemon.variant + 1}` : ""}`);
          this.scene.playSound("sparkle");
        });
      }
      this.scene.time.delayedCall(Utils.fixedInt(!this.skipped ? !isShiny ? 1250 : 1750 : !isShiny ? 250 : 750), () => {
        this.infoContainer.show(this.pokemon, false, this.skipped ? 2 : 1);

        this.scene.playSoundWithoutBgm("evolution_fanfare");

        this.scene.ui.showText(i18next.t("egg:hatchFromTheEgg", { pokemonName: getPokemonNameWithAffix(this.pokemon) }), null, () => {
          this.scene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
          this.scene.gameData.setPokemonCaught(this.pokemon, true, true).then(() => {
            this.scene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex).then((value) => {
              this.eggHatchData.setEggMoveUnlocked(value);
              this.scene.ui.showText(null, 0);
              this.end();
            });
          });
        }, null, true, 3000);
        //this.scene.time.delayedCall(Utils.fixedInt(4250), () => this.scene.playBgm());
      });
    });
    this.scene.tweens.add({
      duration: Utils.fixedInt(this.skipped ? 500 : 3000),
      targets: this.eggHatchOverlay,
      alpha: 0,
      ease: "Cubic.easeOut"
    });
  }

  /**
   * Helper function to generate sine. (Why is this not a Utils?!?)
   * @param index random number from 0-7 being passed in to scale pi/128
   * @param amplitude Scaling
   * @returns a number
   */
  sin(index: integer, amplitude: integer): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  /**
   * Animates spraying
   * @param intensity number of times this is repeated (this is a badly named variable)
   * @param offsetY how much to offset the Y coordinates
   */
  doSpray(intensity: integer, offsetY?: number) {
    this.scene.tweens.addCounter({
      repeat: intensity,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        this.doSprayParticle(Utils.randInt(8), offsetY || 0);
      }
    });
  }

  /**
   * Animates a particle used in the spray animation
   * @param trigIndex Used to modify the particle's vertical speed, is a random number from 0-7
   * @param offsetY how much to offset the Y coordinate
   */
  doSprayParticle(trigIndex: integer, offsetY: number) {
    const initialX = this.eggHatchBg.displayWidth / 2;
    const initialY = this.eggHatchBg.displayHeight / 2 + offsetY;
    const shardKey = !this.egg.isManaphyEgg() ? this.egg.tier.toString() : "1";
    const particle = this.scene.add.image(initialX, initialY, "egg_shard", `${shardKey}_${Math.floor(trigIndex / 2)}`);
    this.eggHatchContainer.add(particle);

    let f = 0;
    let yOffset = 0;
    const speed = 3 - Utils.randInt(8);
    const amp = 24 + Utils.randInt(32);

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      const speedMultiplier = this.skipped ? 6 : 1;
      yOffset += speedMultiplier;
      if (trigIndex < 160) {
        particle.setPosition(initialX + (speed * f) / 3, initialY + yOffset);
        particle.y += -this.sin(trigIndex, amp);
        if (f > 108) {
          particle.setScale((1 - (f - 108) / 20));
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
   * @returns the hatched PlayerPokemon
   */
  generatePokemon(): PlayerPokemon {
    let ret: PlayerPokemon;

    this.scene.executeWithSeedOffset(() => {
      ret = this.egg.generatePlayerPokemon(this.scene);
    }, this.egg.id, EGG_SEED.toString());

    this.eggHatchData = new EggHatchData(this.scene, ret, this.egg.eggMoveIndex);
    return ret;
  }

  //   getNewProperties(pokemon: PlayerPokemon) {
  //     const speciesId = pokemon.species.speciesId;
  //     let newProperties = {newEggMove: false, newStarter: false};

  //     if (!this.starterData[speciesId].eggMoves) {
  //       this.starterData[speciesId].eggMoves = 0;
  //     }

  //     const value = Math.pow(2, eggMoveIndex);

//     if (this.starterData[speciesId].eggMoves & value) {
//       resolve(false);
//       return;
//     }
//   }
}

export class EggHatchData {
  public pokemon: PlayerPokemon;
  public eggMoveIndex: integer;
  public eggMoveUnlocked: boolean;
  public prevDexEntry: DexEntry;
  public prevStarterEntry: StarterDataEntry;
  private scene: BattleScene;

  constructor(scene: BattleScene, pokemon: PlayerPokemon, eggMoveIndex: integer) {
    this.scene = scene;
    this.pokemon = pokemon;
    this.eggMoveIndex = eggMoveIndex;
  }

  setEggMoveUnlocked(unlocked: boolean) {
    this.eggMoveUnlocked  = unlocked;
  }

  setDex() {
    const currDexEntry = this.scene.gameData.dexData[this.pokemon.species.speciesId];
    const starterDataEntry = this.scene.gameData.starterData[this.pokemon.species.getRootSpeciesId()];
    // this.prevDexEntry = this.scene.gameData.dexData[this.pokemon.species.speciesId];
    this.prevDexEntry = {
      seenAttr: currDexEntry.seenAttr,
      caughtAttr: currDexEntry.caughtAttr,
      natureAttr: currDexEntry.natureAttr,
      seenCount: currDexEntry.seenCount,
      caughtCount: currDexEntry.caughtCount,
      hatchedCount: currDexEntry.hatchedCount,
      ivs: [...currDexEntry.ivs]
    };
    this.prevStarterEntry = {
      moveset: starterDataEntry.moveset,
      eggMoves: starterDataEntry.eggMoves,
      candyCount: starterDataEntry.candyCount,
      friendship: starterDataEntry.friendship,
      abilityAttr: starterDataEntry.abilityAttr,
      passiveAttr: starterDataEntry.passiveAttr,
      valueReduction: starterDataEntry.valueReduction,
      classicWinCount: starterDataEntry.classicWinCount
    };
    console.log("setting dex:");
    console.log(this.prevDexEntry);
    // export interface DexEntry {

    // }
  }

  getDex(): DexEntry {
    console.log("getting dex:");
    console.log(this.prevDexEntry);
    return this.prevDexEntry;
  }

  // function that can be called when doing egg summary to set dex one at a time
  updatePokemon(showMessage : boolean = false) {
    console.log("setting dex (actual, local):");
    const currDexEntry = this.scene.gameData.dexData[this.pokemon.species.speciesId];
    console.log(currDexEntry);
    console.log(this.prevDexEntry);
    this.setDex();
    // this.setDex();
    return new Promise<void>(resolve => {
      // this.scene.ui.showText(`${this.pokemonHatched[0].name}`, 0);
      this.scene.gameData.setPokemonCaught(this.pokemon, true, true, showMessage).then(() => {
        //TODO pass through egg move updates
        // console.log("set IVs");
        this.scene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
        // console.log("set egg moves");
        this.scene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex, showMessage).then((value) => {
          console.log(value);
          this.eggMoveUnlocked = value;
          console.log("updates complete, logging actual dex and local dexEntry");
          const currDexEntry = this.scene.gameData.dexData[this.pokemon.species.speciesId];
          console.log(currDexEntry);
          console.log(this.prevDexEntry);

          resolve();
        });
      });
    });
  }

  getEggMove() {
    // TODO easy function to get egg move for display (or no egg move)
  }
}

export class EggSummaryPhase extends Phase {
  private egg: Egg;
  private eggHatchData: EggHatchData[];
  private showMessages: boolean;

  private eggHatchHandler: EggHatchSceneHandler;
  private eggHatchContainer: Phaser.GameObjects.Container;
  private eggHatchBg: Phaser.GameObjects.Image;
  private pokemonBg: Phaser.GameObjects.Image;
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;

  private infoContainer: PokemonInfoContainer;
  private spriteContainers: Phaser.GameObjects.Container[];
  private shinyIcons: Phaser.GameObjects.Image[];
  private hiddenAbilityIcons: Phaser.GameObjects.Image[];
  private pokeballIcons: Phaser.GameObjects.Image[];
  private eggMoveIcons: Phaser.GameObjects.Image[];
  private infoContainers: PokemonInfoContainer[];
  constructor(scene: BattleScene, eggHatchData: EggHatchData[]) {
    super(scene);
    this.eggHatchData = eggHatchData;
  }

  start() {
    super.start();

    // 55 pokemon total now
    // for (let i = 0; i < 44; i++) {
    //   this.pokemonHatched.push(this.scene.addPlayerPokemon(getPokemonSpecies(Species.PIKACHU), 1, undefined, undefined, undefined, false));
    // }

    // for (const eggInfo of this.eggHatchData) {
    //   eggInfo.updatePokemon(false);
    // }

    const updateNextPokemon = (i: integer) => {
      console.log(i);
      if (i >= this.eggHatchData.length) {
        console.log("displayed all pokemon");
        this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          this.scene.fadeOutBgm(null, false);

          this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

          this.eggHatchContainer = this.eggHatchHandler.eggHatchContainer;
        });

        // this.scene.ui.showText(" ", null, () => {
        //   // this.scene.ui.showText(null, 0);
        //   // this.scene.tweens.add({
        //   //   duration: Utils.fixedInt(3000),
        //   //   targets: this.eggHatchOverlay,
        //   //   alpha: 0,
        //   //   ease: "Cubic.easeOut"
        //   console.log("displayed all pokemon");
        //   // TODO change end to be called by UI
        //   // this.end();
        // }, null, true);

      } else {
        this.eggHatchData[i].updatePokemon().then(() => {
          console.log("updating next pokemon");
          if (i < this.eggHatchData.length) {
            updateNextPokemon(i + 1);
          }
        });
      }
    };
    updateNextPokemon(0);


    // this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {

    //   this.scene.fadeOutBgm(null, false);

    //   this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

    //   this.eggHatchContainer = this.eggHatchHandler.eggHatchContainer;

    // });

    //////////////// old method


    // this.eggHatchBg = this.scene.add.image(0, 0, "egg_list_bg");
    // this.pokemonBg = this.scene.add.image(0, 0, "starter_container_bg");
    // this.eggHatchContainer.add(this.eggHatchBg);
    // this.eggHatchContainer.add(this.pokemonBg);
    // this.eggHatchBg.setOrigin(0, 0);
    // this.pokemonBg.setOrigin(0.3,0);
    // this.pokemonBg.setDepth(1);
    // this.pokemonBg.setScale(1,1);

    // this.eggHatchOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0xFFFFFF);
    // this.eggHatchOverlay.setOrigin(0, 0);
    // this.eggHatchOverlay.setAlpha(0);
    // this.scene.fieldUI.add(this.eggHatchOverlay);

    // this.infoContainer = new PokemonInfoContainer(this.scene);
    // this.infoContainer.setup();
    // this.eggHatchContainer.add(this.infoContainer);


    // this.spriteContainers = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const container = this.scene.add.container(0, 0);
    //   if (i) {
    //     container.setVisible(false);
    //   }
    //   this.eggHatchContainer.add(container);
    //   return container;
    // });

    // //TODO format grid properly with pokemon sprites
    // let i = 0;
    // let cols = 11;
    // let size = 22;
    // if (this.pokemonHatched.length >= 50) {
    //   cols = 13;
    //   size = 14;
    // }
    // const scale_size = size * 2;

    // this.shinyIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const x = (i % cols) * size;
    //   const y = Math.floor(i / cols) * size;
    //   const ret = this.scene.add.image(x + 0.1 * size, y + 0.2 * size, "shiny_star_small");
    //   ret.setOrigin(0, 0);
    //   ret.setScale(size / scale_size);
    //   ret.setVisible(true);
    //   this.eggHatchContainer.add(ret);
    //   return ret;
    // });

    // this.hiddenAbilityIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const x = (i % cols) * size;
    //   const y = Math.floor(i / cols) * size;
    //   const ret = this.scene.add.image(x + 0.5 * size, y + 0.9 * size, "ha_capsule");
    //   ret.setOrigin(0, 0);
    //   ret.setScale(size / scale_size);
    //   ret.setVisible(true);
    //   this.eggHatchContainer.add(ret);
    //   return ret;
    // });

    // this.pokeballIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const x = (i % cols) * size;
    //   const y = Math.floor(i / cols) * size;
    //   const ret = this.scene.add.image(x+ 0.1 * size, y + 0.9 * size, "icon_owned");
    //   ret.setOrigin(0, 0);
    //   ret.setScale(size / scale_size);
    //   ret.setVisible(true);
    //   this.eggHatchContainer.add(ret);
    //   return ret;
    // });

    // this.eggMoveIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const x = (i % cols) * size;
    //   const y = Math.floor(i / cols) * size;
    //   const ret = this.scene.add.image(x + 0.8 * size, y + 0.9 * size, "icon_owned");
    //   ret.setOrigin(0, 0);
    //   ret.setScale(size / scale_size);
    //   ret.setVisible(true);
    //   ret.setTint(0.5);
    //   this.eggHatchContainer.add(ret);
    //   return ret;
    // });

    // this.infoContainers = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
    //   const ret = new PokemonInfoContainer(this.scene);
    //   ret.setup();
    //   ret.show(this.pokemonHatched[i]);
    //   this.eggHatchContainer.add(ret);
    //   return ret;
    // });

    // for (const displayPokemon of this.pokemonHatched) {
    //   console.log(displayPokemon);
    //   // const x = (index % 9) * 18;
    //   // const y = Math.floor(index / 9) * 18;
    //   const x = (i % cols) * size;
    //   const y = Math.floor(i / cols) * size;
    //   const icon = this.scene.add.sprite(x-2, y+2, displayPokemon.species.getIconAtlasKey(displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant));
    //   icon.setScale(size / (scale_size));
    //   icon.setOrigin(0, 0);
    //   icon.setFrame(displayPokemon.species.getIconId(displayPokemon.gender === Gender.FEMALE, displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant));
    //   // this.checkIconId(icon, displayPokemon.species, displayPokemon.female, displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant);
    //   this.spriteContainers[i].add(icon);
    //   this.spriteContainers[i].setVisible(true);

    //   // const cursorObj = this.scene.add.image(x, y, "select_cursor_pokerus");
    //   // cursorObj.setVisible(true);
    //   // cursorObj.setOrigin(0, 0);
    //   // cursorObj.setScale(size / scale_size * 2);
    //   // this.spriteContainers[i].add(cursorObj);

    //   // DONE shiny icon funcitonality for variants
    //   // TODO test shiny icons
    //   this.shinyIcons[i].setVisible(displayPokemon.shiny);
    //   this.shinyIcons[i].setTint(getVariantTint(displayPokemon.variant));
    //   // this.shinyIcons[i].setTint(getVariantTint(speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2));
    //   // DONE new pokemon / catch icon functionality
    //   // TODO test for new pokemon
    //   const dexEntry = this.scene.gameData.dexData[this.pokemonHatched[i].species.speciesId];
    //   const caughtAttr = dexEntry.caughtAttr;
    //   this.pokeballIcons[i].setVisible(!caughtAttr);
    //   // this.pokeballIcons[i].setVisible(this.scene.gameData.dexData[displayPokemon.species.speciesId].caughtAttr)
    //   // DONE? hidden ability icon functionality
    //   // TODO test hidden abilities / ask
    //   this.hiddenAbilityIcons[i].setVisible((displayPokemon.abilityIndex >= 2));

    //   // TODO new egg move icon functionality
    //   this.eggMoveIcons[i].setVisible(true);
    //   i++;
    // }



    // // for(const ret of this.pokemonHatched) {
    // console.log(this.pokemonHatched);
    // console.log(this.newEggMoves);


    // this.scene.ui.showText(`${this.pokemonHatched.length} eggs hatched. Skip messages?`, 0);
    // this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
    //   console.log("messages skipped");
    //   this.showMessages = false;
    //   updateNextPokemon(0);
    // }, () => {
    //   console.log("messages shown");
    //   this.showMessages = true;
    //   updateNextPokemon(0);
    // }
    // );
    // this.scene.ui.showText(`${this.pokemonHatched.length} eggs hatched. Skip messages?`, null, () => {
    // this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
    //   this.scene.ui.setMode(Mode.MESSAGE);
    //   this.showMessages = false;
    //   updateNextPokemon(0);
    // }, () => {
    //   this.scene.ui.setMode(Mode.MESSAGE);
    //   this.showMessages = true;
    //   updateNextPokemon(0);
    // }



    // });
  }

  // updatePokemon(pokemon: PlayerPokemon, eggMoveIndex: integer, showMessage : boolean = false) {
  //   console.log(pokemon);
  //   return new Promise<void>(resolve => {
  //     // this.scene.ui.showText(`${this.pokemonHatched[0].name}`, 0);
  //     this.scene.gameData.setPokemonCaught(pokemon, true, true, showMessage).then(() => {
  //       //TODO pass through egg move updates
  //       // console.log("set IVs");
  //       this.scene.gameData.updateSpeciesDexIvs(pokemon.species.speciesId, pokemon.ivs);
  //       // console.log("set egg moves");
  //       this.scene.gameData.setEggMoveUnlocked(pokemon.species, eggMoveIndex, showMessage).then((value) => {
  //         if (value) {
  //           this.eggMoveUnlocks.push(true);
  //           console.log("new egg move?");
  //         } else {
  //           this.eggMoveUnlocks.push(false);
  //         }
  //         resolve();
  //       });
  //     });
  //   });
  // }

  end() {
    console.log("ended egg hatch summary phase");
    this.scene.tweens.add({
      duration: Utils.fixedInt(250),
      targets: this.eggHatchOverlay,
      alpha: 0,
      ease: "Cubic.easeOut"
    });
    this.eggHatchHandler.clear();
    this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    super.end();
  }
}
