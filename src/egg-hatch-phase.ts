import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { Phase } from "./phase";
import BattleScene, { AnySound } from "./battle-scene";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { EGG_SEED, Egg, GachaType, getLegendaryGachaSpeciesForTimestamp } from "./data/egg";
import EggHatchSceneHandler from "./ui/egg-hatch-scene-handler";
import { PlayerPokemon } from "./field/pokemon";
import { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";
import { achvs } from "./system/achv";
import { pokemonPrevolutions } from "./data/pokemon-evolutions";
import PokemonInfoContainer from "./ui/pokemon-info-container";
import EggCounterContainer from "./ui/egg-counter-container";
import { EggCountChangedEvent } from "./events/egg";
import { EggTier } from "#enums/egg-type";
import { Species } from "#enums/species";

/**
 * Class that represents egg hatching
 */
export class EggHatchPhase extends Phase {
  /** The egg that is hatching */
  private egg: Egg;

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

  constructor(scene: BattleScene, egg: Egg, eggsToHatchCount: integer) {
    super(scene);

    this.egg = egg;
    this.eggsToHatchCount = eggsToHatchCount;
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

        this.scene.ui.showText(`${this.pokemon.name} hatched from the egg!`, null, () => {
          this.scene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
          this.scene.gameData.setPokemonCaught(this.pokemon, true, true).then(() => {
            this.scene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex).then(() => {
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
    let speciesOverride: Species; // SpeciesOverride should probably be a passed in parameter for future species-eggs

    this.scene.executeWithSeedOffset(() => {

      /**
       * Manaphy eggs have a 1/8 chance of being Manaphy and 7/8 chance of being Phione
       * Legendary eggs pulled from the legendary gacha have a 50% of being converted into
       * the species that was the legendary focus at the time
       */
      if (this.egg.isManaphyEgg()) {
        const rand = Utils.randSeedInt(8);

        speciesOverride = rand ? Species.PHIONE : Species.MANAPHY;
      } else if (this.egg.tier === EggTier.MASTER
        && this.egg.gachaType === GachaType.LEGENDARY) {
        if (!Utils.randSeedInt(2)) {
          speciesOverride = getLegendaryGachaSpeciesForTimestamp(this.scene, this.egg.timestamp);
        }
      }

      if (speciesOverride) {
        const pokemonSpecies = getPokemonSpecies(speciesOverride);
        ret = this.scene.addPlayerPokemon(pokemonSpecies, 1, undefined, undefined, undefined, false);
      } else {
        let minStarterValue: integer;
        let maxStarterValue: integer;

        switch (this.egg.tier) {
        case EggTier.GREAT:
          minStarterValue = 4;
          maxStarterValue = 5;
          break;
        case EggTier.ULTRA:
          minStarterValue = 6;
          maxStarterValue = 7;
          break;
        case EggTier.MASTER:
          minStarterValue = 8;
          maxStarterValue = 9;
          break;
        default:
          minStarterValue = 1;
          maxStarterValue = 3;
          break;
        }

        const ignoredSpecies = [ Species.PHIONE, Species.MANAPHY, Species.ETERNATUS ];

        let speciesPool = Object.keys(speciesStarters)
          .filter(s => speciesStarters[s] >= minStarterValue && speciesStarters[s] <= maxStarterValue)
          .map(s => parseInt(s) as Species)
          .filter(s => !pokemonPrevolutions.hasOwnProperty(s) && getPokemonSpecies(s).isObtainable() && ignoredSpecies.indexOf(s) === -1);

        // If this is the 10th egg without unlocking something new, attempt to force it.
        if (this.scene.gameData.unlockPity[this.egg.tier] >= 9) {
          const lockedPool = speciesPool.filter(s => !this.scene.gameData.dexData[s].caughtAttr);
          if (lockedPool.length) { // Skip this if everything is unlocked
            speciesPool = lockedPool;
          }
        }

        /**
         * Pokemon that are cheaper in their tier get a weight boost. Regionals get a weight penalty
         * 1 cost mons get 2x
         * 2 cost mons get 1.5x
         * 4, 6, 8 cost mons get 1.75x
         * 3, 5, 7, 9 cost mons get 1x
         * Alolan, Galarian, and Paldean mons get 0.5x
         * Hisui mons get 0.125x
         *
         * The total weight is also being calculated EACH time there is an egg hatch instead of being generated once
         * and being the same each time
         */
        let totalWeight = 0;
        const speciesWeights = [];
        for (const speciesId of speciesPool) {
          let weight = Math.floor((((maxStarterValue - speciesStarters[speciesId]) / ((maxStarterValue - minStarterValue) + 1)) * 1.5 + 1) * 100);
          const species = getPokemonSpecies(speciesId);
          if (species.isRegional()) {
            weight = Math.floor(weight / (species.isRareRegional() ? 8 : 2));
          }
          speciesWeights.push(totalWeight + weight);
          totalWeight += weight;
        }

        let species: Species;

        const rand = Utils.randSeedInt(totalWeight);
        for (let s = 0; s < speciesWeights.length; s++) {
          if (rand < speciesWeights[s]) {
            species = speciesPool[s];
            break;
          }
        }

        if (!!this.scene.gameData.dexData[species].caughtAttr) {
          this.scene.gameData.unlockPity[this.egg.tier] = Math.min(this.scene.gameData.unlockPity[this.egg.tier] + 1, 10);
        } else {
          this.scene.gameData.unlockPity[this.egg.tier] = 0;
        }

        const pokemonSpecies = getPokemonSpecies(species);

        ret = this.scene.addPlayerPokemon(pokemonSpecies, 1, undefined, undefined, undefined, false);
      }

      /**
       * Non Shiny gacha Pokemon have a 1/128 chance of being shiny
       * Shiny gacha Pokemon have a 1/64 chance of being shiny
       * IVs are rolled twice and the higher of each stat's IV is taken
       * The egg move gacha doubles the rate of rare egg moves but the base rates are
       * Common: 1/48
       * Rare: 1/24
       * Epic: 1/12
       * Legendary: 1/6
       */
      ret.trySetShiny(this.egg.gachaType === GachaType.SHINY ? 1024 : 512);
      ret.variant = ret.shiny ? ret.generateVariant() : 0;

      const secondaryIvs = Utils.getIvsFromId(Utils.randSeedInt(4294967295));

      for (let s = 0; s < ret.ivs.length; s++) {
        ret.ivs[s] = Math.max(ret.ivs[s], secondaryIvs[s]);
      }

      const baseChance = this.egg.gachaType === GachaType.MOVE ? 3 : 6;
      this.eggMoveIndex = Utils.randSeedInt(baseChance * Math.pow(2, 3 - this.egg.tier))
        ? Utils.randSeedInt(3)
        : 3;

    }, this.egg.id, EGG_SEED.toString());

    return ret;
  }
}
