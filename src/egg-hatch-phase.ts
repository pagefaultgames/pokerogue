import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { Phase } from "./phase";
import BattleScene, { AnySound } from "./battle-scene";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { EGG_SEED, Egg, GachaType, getLegendaryGachaSpeciesForTimestamp } from "./data/egg";
import EggHatchSceneHandler from "./ui/egg-hatch-scene-handler";
import { Species } from "./data/enums/species";
import { PlayerPokemon } from "./field/pokemon";
import { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";
import { achvs } from "./system/achv";
import { pokemonPrevolutions } from "./data/pokemon-evolutions";
import { EggTier } from "./data/enums/egg-type";
import PokemonInfoContainer from "./ui/pokemon-info-container";

export class EggHatchPhase extends Phase {
  private egg: Egg;

  private eggHatchHandler: EggHatchSceneHandler;
  private eggHatchContainer: Phaser.GameObjects.Container;
  private eggHatchBg: Phaser.GameObjects.Image;
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;
  private eggContainer: Phaser.GameObjects.Container;
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggCrackSprite: Phaser.GameObjects.Sprite;
  private eggLightraysOverlay: Phaser.GameObjects.Sprite;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonShinySparkle: Phaser.GameObjects.Sprite;

  private infoContainer: PokemonInfoContainer;

  private pokemon: PlayerPokemon;
  private eggMoveIndex: integer;
  private hatched: boolean;
  private canSkip: boolean;
  private skipped: boolean;
  private evolutionBgm: AnySound;

  constructor(scene: BattleScene, egg: Egg) {
    super(scene);

    this.egg = egg;
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SCENE).then(() => {

      if (!this.egg)
        return this.end();

      const eggIndex = this.scene.gameData.eggs.findIndex(e => e.id === this.egg.id);

      if (eggIndex === -1)
        return this.end();

      this.scene.gameData.eggs.splice(eggIndex, 1);

      this.scene.fadeOutBgm(null, false);

      this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

      this.eggHatchContainer = this.eggHatchHandler.eggHatchContainer;

      this.eggHatchBg = this.scene.add.image(0, 0, 'default_bg');
      this.eggHatchBg.setOrigin(0, 0);
      this.eggHatchContainer.add(this.eggHatchBg);

      this.eggContainer = this.scene.add.container(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2);

      this.eggSprite = this.scene.add.sprite(0, 0, 'egg', `egg_${this.egg.getKey()}`);
      this.eggCrackSprite = this.scene.add.sprite(0, 0, 'egg_crack', '0');
      this.eggCrackSprite.setVisible(false);

      this.eggLightraysOverlay = this.scene.add.sprite((-this.eggHatchBg.displayWidth / 2) + 4, -this.eggHatchBg.displayHeight / 2, 'egg_lightrays', '3');
      this.eggLightraysOverlay.setOrigin(0, 0);
      this.eggLightraysOverlay.setVisible(false);

      this.eggContainer.add(this.eggSprite);
      this.eggContainer.add(this.eggCrackSprite);
      this.eggContainer.add(this.eggLightraysOverlay);
      this.eggHatchContainer.add(this.eggContainer);

      const getPokemonSprite = () => {
        const ret = this.scene.add.sprite(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2, `pkmn__sub`);
        ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
        return ret;
      };

      this.eggHatchContainer.add((this.pokemonSprite = getPokemonSprite()));

      this.pokemonShinySparkle = this.scene.add.sprite(this.pokemonSprite.x, this.pokemonSprite.y, 'shiny');
      this.pokemonShinySparkle.setVisible(false);

      this.eggHatchContainer.add(this.pokemonShinySparkle);

      this.eggHatchOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0xFFFFFF);
      this.eggHatchOverlay.setOrigin(0, 0);
      this.eggHatchOverlay.setAlpha(0);
      this.scene.fieldUI.add(this.eggHatchOverlay);

      this.infoContainer = new PokemonInfoContainer(this.scene);
      this.infoContainer.setup();

      this.eggHatchContainer.add(this.infoContainer);

      const pokemon = this.generatePokemon();
      if (pokemon.fusionSpecies)
        pokemon.clearFusionSpecies();

      this.pokemonSprite.setVisible(false);

      this.pokemon = pokemon;

      pokemon.loadAssets().then(() => {
        this.canSkip = true;

        this.scene.time.delayedCall(1000, () => {
          if (!this.hatched)
            this.evolutionBgm = this.scene.playSoundWithoutBgm('evolution');
        });

        this.scene.time.delayedCall(2000, () => {
          if (this.hatched)
            return;
          this.eggCrackSprite.setVisible(true);
          this.doSpray(1, this.eggSprite.displayHeight / -2);
          this.doEggShake(2).then(() => {
            if (this.hatched)
              return;
            this.scene.time.delayedCall(1000, () => {
              if (this.hatched)
                return;
              this.doSpray(2, this.eggSprite.displayHeight / -4);
              this.eggCrackSprite.setFrame('1');
              this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame('2'));
              this.doEggShake(4).then(() => {
                if (this.hatched)
                  return;
                this.scene.time.delayedCall(1000, () => {
                  if (this.hatched)
                    return;
                  this.scene.playSound('egg_crack');
                  this.doSpray(4);
                  this.eggCrackSprite.setFrame('3');
                  this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame('4'));
                  this.doEggShake(8, 2).then(() => {
                    if (!this.hatched)
                      this.doHatch();
                  });
                });
              });
            })
          });
        });
      });
    });
  }

  end() {
    if (this.scene.findPhase((p) => p instanceof EggHatchPhase))
      this.eggHatchHandler.clear();
    else
      this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    super.end();
  }

  doEggShake(intensity: number, repeatCount?: integer, count?: integer): Promise<void> {
    return new Promise(resolve => {
      if (repeatCount === undefined)
        repeatCount = 0;
      if (count === undefined)
        count = 0;
      this.scene.playSound('pb_move');
      this.scene.tweens.add({
        targets: this.eggContainer,
        x: `-=${intensity / (count ? 1 : 2)}`,
        ease: 'Sine.easeInOut',
        duration: 125,
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.eggContainer,
            x: `+=${intensity}`,
            ease: 'Sine.easeInOut',
            duration: 250,
            onComplete: () => {
              count++;
              if (count < repeatCount)
                return this.doEggShake(intensity, repeatCount, count).then(() => resolve());
              this.scene.tweens.add({
                targets: this.eggContainer,
                x: `-=${intensity / 2}`,
                ease: 'Sine.easeInOut',
                duration: 125,
                onComplete: () => resolve()
              });
            }
          })
        }
      });
    });
  }

  trySkip(): boolean {
    if (!this.canSkip || this.skipped)
      return false;
    this.skipped = true;
    if (!this.hatched)
      this.doHatch();
    else
      this.doReveal();
    return true;
  }

  doHatch(): void {
    this.canSkip = false;
    this.hatched = true;
    if (this.evolutionBgm)
      SoundFade.fadeOut(this.scene, this.evolutionBgm, Utils.fixedInt(100));
    for (let e = 0; e < 5; e++)
      this.scene.time.delayedCall(Utils.fixedInt(375 * e), () => this.scene.playSound('egg_hatch', { volume: 1 - (e * 0.2) }));
    this.eggLightraysOverlay.setVisible(true);
    this.eggLightraysOverlay.play('egg_lightrays');
    this.scene.tweens.add({
      duration: Utils.fixedInt(125),
      targets: this.eggHatchOverlay,
      alpha: 1,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.skipped = false;
        this.canSkip = true;
      }
    });
    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
      this.canSkip = false;
      if (!this.skipped)
        this.doReveal();
    });
  }

  doReveal(): void {
    const isShiny = this.pokemon.isShiny();
    if (this.pokemon.species.mythical)
      this.scene.validateAchv(achvs.HATCH_MYTHICAL);
    if (this.pokemon.species.legendary)
      this.scene.validateAchv(achvs.HATCH_LEGENDARY);
    if (isShiny)
      this.scene.validateAchv(achvs.HATCH_SHINY);
    this.eggContainer.setVisible(false);
    this.pokemonSprite.play(this.pokemon.getSpriteKey(true));
    this.pokemonSprite.setPipelineData('ignoreTimeTint', true);
    this.pokemonSprite.setPipelineData('spriteKey', this.pokemon.getSpriteKey());
    this.pokemonSprite.setPipelineData('shiny', this.pokemon.shiny);
    this.pokemonSprite.setPipelineData('variant', this.pokemon.variant);
    this.pokemonSprite.setVisible(true);
    this.scene.time.delayedCall(Utils.fixedInt(250), () => {
      this.pokemon.cry();
      if (isShiny) {
        this.scene.time.delayedCall(Utils.fixedInt(500), () => {
          this.pokemonShinySparkle.play(`sparkle${this.pokemon.variant ? `_${this.pokemon.variant + 1}` : ''}`);
          this.scene.playSound('sparkle');
        });
      }
      this.scene.time.delayedCall(Utils.fixedInt(!this.skipped ? !isShiny ? 1250 : 1750 : !isShiny ? 250 : 750), () => {
        this.infoContainer.show(this.pokemon, false, this.skipped ? 2 : 1);

        this.scene.playSoundWithoutBgm('evolution_fanfare');
        
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
      ease: 'Cubic.easeOut'
    });
  }

  sin(index: integer, amplitude: integer): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  doSpray(intensity: integer, offsetY?: number) {
    this.scene.tweens.addCounter({
      repeat: intensity,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        this.doSprayParticle(Utils.randInt(8), offsetY || 0);
      }
    });
  }

  doSprayParticle(trigIndex: integer, offsetY: number) {
    const initialX = this.eggHatchBg.displayWidth / 2;
    const initialY = this.eggHatchBg.displayHeight / 2 + offsetY;
    const shardKey = !this.egg.isManaphyEgg() ? this.egg.tier.toString() : '1';
    const particle = this.scene.add.image(initialX, initialY, 'egg_shard', `${shardKey}_${Math.floor(trigIndex / 2)}`);
    this.eggHatchContainer.add(particle);

    let f = 0;
    let yOffset = 0;
    let speed = 3 - Utils.randInt(8);
    let amp = 24 + Utils.randInt(32);

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
        if (f > 108)
          particle.setScale((1 - (f - 108) / 20));
        trigIndex += 2 * speedMultiplier;
        f += speedMultiplier;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  generatePokemon(): PlayerPokemon {
    let ret: PlayerPokemon;
    let speciesOverride: Species;

    this.scene.executeWithSeedOffset(() => {

      if (this.egg.isManaphyEgg()) {
        const rand = Utils.randSeedInt(8);
  
        speciesOverride = rand ? Species.PHIONE : Species.MANAPHY;
      } else if (this.egg.tier === EggTier.MASTER
        && this.egg.gachaType === GachaType.LEGENDARY) {
        if (!Utils.randSeedInt(2))
          speciesOverride = getLegendaryGachaSpeciesForTimestamp(this.scene, this.egg.timestamp);
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

        let totalWeight = 0;
        const speciesWeights = [];
        for (let speciesId of speciesPool) {
          let weight = Math.floor((((maxStarterValue - speciesStarters[speciesId]) / ((maxStarterValue - minStarterValue) + 1)) * 1.5 + 1) * 100);
          const species = getPokemonSpecies(speciesId);
          if (species.isRegional())
            weight = Math.floor(weight / (species.isRareRegional() ? 8 : 2));
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

        const pokemonSpecies = getPokemonSpecies(species);

        ret = this.scene.addPlayerPokemon(pokemonSpecies, 1, undefined, undefined, undefined, false);
      }

      ret.trySetShiny(this.egg.gachaType === GachaType.SHINY ? 1024 : 512);
      ret.variant = ret.shiny ? ret.generateVariant() : 0;

      const secondaryIvs = Utils.getIvsFromId(Utils.randSeedInt(4294967295));

      for (let s = 0; s < ret.ivs.length; s++)
        ret.ivs[s] = Math.max(ret.ivs[s], secondaryIvs[s]);
      
      const baseChance = this.egg.gachaType === GachaType.MOVE ? 3 : 6;
      this.eggMoveIndex = Utils.randSeedInt(baseChance * Math.pow(2, 3 - this.egg.tier))
        ? Utils.randSeedInt(3)
        : 3;

    }, this.egg.id, EGG_SEED.toString());
    
    return ret;
  }
}