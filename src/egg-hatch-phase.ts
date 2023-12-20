import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlePhase } from "./battle-phase";
import BattleScene, { AnySound } from "./battle-scene";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { EGG_SEED, Egg, GachaType, getLegendaryGachaSpeciesForTimestamp, getTypeGachaTypeForTimestamp } from "./data/egg";
import EggHatchSceneHandler from "./ui/egg-hatch-scene-handler";
import { ModifierTier } from "./modifier/modifier-type";
import { Species } from "./data/species";
import Pokemon, { PlayerPokemon } from "./pokemon";
import { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";
import { StatsContainer } from "./ui/stats-container";
import { TextStyle, addTextObject } from "./ui/text";
import { Gender, getGenderColor, getGenderSymbol } from "./data/gender";
import { achvs } from "./system/achv";

export class EggHatchPhase extends BattlePhase {
  private egg: Egg;

  private eggHatchContainer: Phaser.GameObjects.Container;
  private eggHatchBg: Phaser.GameObjects.Image;
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;
  private eggContainer: Phaser.GameObjects.Container;
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggCrackSprite: Phaser.GameObjects.Sprite;
  private eggLightraysOverlay: Phaser.GameObjects.Sprite;
  private pokemonSprite: Phaser.GameObjects.Sprite;

  private infoContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;

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

      const eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

      this.eggHatchContainer = eggHatchHandler.eggHatchContainer;

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

      const getPokemonSprite = () => this.scene.add.sprite(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2, `pkmn__sub`);

      this.eggHatchContainer.add((this.pokemonSprite = getPokemonSprite()));

      this.eggHatchOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0xFFFFFF);
      this.eggHatchOverlay.setOrigin(0, 0);
      this.eggHatchOverlay.setAlpha(0);
      this.scene.fieldUI.add(this.eggHatchOverlay);

      const infoBg = this.scene.add.nineslice(0, 0, 'window', null, 96, 116, 6, 6, 6, 6);

      this.infoContainer = this.scene.add.container(this.eggHatchBg.displayWidth + infoBg.width / 2, this.eggHatchBg.displayHeight / 2);

      this.statsContainer = new StatsContainer(this.scene, -48, -54, true);

      this.infoContainer.add(infoBg);
      this.infoContainer.add(this.statsContainer);

      const pokemonGenderLabelText = addTextObject(this.scene, -16, 32, 'Gender:', TextStyle.WINDOW, { fontSize: '64px' });
      pokemonGenderLabelText.setOrigin(1, 0);
      pokemonGenderLabelText.setVisible(false);
      this.infoContainer.add(pokemonGenderLabelText);

      const pokemonGenderText = addTextObject(this.scene, -12, 32, '', TextStyle.WINDOW, { fontSize: '64px' });
      pokemonGenderText.setOrigin(0, 0);
      pokemonGenderText.setVisible(false);
      this.infoContainer.add(pokemonGenderText);

      const pokemonAbilityLabelText = addTextObject(this.scene, -16, 32, 'Ability:', TextStyle.WINDOW, { fontSize: '64px' });
      pokemonAbilityLabelText.setOrigin(1, 0);
      this.infoContainer.add(pokemonAbilityLabelText);

      const pokemonAbilityText = addTextObject(this.scene, -12, 32, '', TextStyle.WINDOW, { fontSize: '64px' });
      pokemonAbilityText.setOrigin(0, 0);
      this.infoContainer.add(pokemonAbilityText);

      this.eggHatchContainer.add(this.infoContainer);

      const pokemon = this.generatePokemon();

      let abilityYOffset = 5;

      if (pokemon.gender > Gender.GENDERLESS) {
        pokemonGenderText.setText(getGenderSymbol(pokemon.gender));
        pokemonGenderText.setColor(getGenderColor(pokemon.gender));
        pokemonGenderText.setShadowColor(getGenderColor(pokemon.gender, true));
        pokemonGenderLabelText.setVisible(true);
        pokemonGenderText.setVisible(true);

        abilityYOffset = 10;
      }

      [ pokemonAbilityLabelText, pokemonAbilityText ].map(t => t.y += abilityYOffset);

      pokemonAbilityText.setText(pokemon.getAbility().name);

      const originalIvs: integer[] = this.scene.gameData.dexData[pokemon.species.speciesId].caughtAttr
        ? this.scene.gameData.dexData[pokemon.species.speciesId].ivs
        : null;

      this.statsContainer.updateIvs(pokemon.ivs, originalIvs);

      this.pokemonSprite.setVisible(false);

      let evolutionBgm: AnySound;

      pokemon.loadAssets().then(() => {
        this.scene.time.delayedCall(1000, () => evolutionBgm = this.scene.playSoundWithoutBgm('evolution'));

        this.scene.time.delayedCall(2000, () => {
          this.eggCrackSprite.setVisible(true);
          this.doSpray(1, this.eggSprite.displayHeight / -2);
          this.doEggShake(2).then(() => {
            this.scene.time.delayedCall(1000, () => {
              this.doSpray(2, this.eggSprite.displayHeight / -4);
              this.eggCrackSprite.setFrame('1');
              this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame('2'));
              this.doEggShake(4).then(() => {
                this.scene.time.delayedCall(1000, () => {
                  this.scene.playSound('egg_crack');
                  this.doSpray(4);
                  this.eggCrackSprite.setFrame('3');
                  this.scene.time.delayedCall(125, () => this.eggCrackSprite.setFrame('4'));
                  this.doEggShake(8, 2).then(() => {
                    SoundFade.fadeOut(this.scene, evolutionBgm, Utils.fixedInt(100));
                    for (let e = 0; e < 5; e++)
                      this.scene.time.delayedCall(Utils.fixedInt(375 * e), () => this.scene.playSound('egg_hatch', { volume: 1 - (e * 0.2) }));
                    this.eggLightraysOverlay.setVisible(true);
                    this.eggLightraysOverlay.play('egg_lightrays');
                    this.scene.tweens.add({
                      duration: Utils.fixedInt(125),
                      targets: this.eggHatchOverlay,
                      alpha: 1,
                      ease: 'Cubic.easeIn'
                    });
                    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
                      if (pokemon.species.mythical)
                        this.scene.validateAchv(achvs.HATCH_MYTHICAL);
                      if (pokemon.species.legendary)
                        this.scene.validateAchv(achvs.HATCH_LEGENDARY);
                      if (pokemon.isShiny())
                        this.scene.validateAchv(achvs.HATCH_SHINY);
                      this.eggContainer.setVisible(false);
                      this.pokemonSprite.play(pokemon.getSpriteKey(true));
                      this.pokemonSprite.setVisible(true);
                      this.scene.time.delayedCall(Utils.fixedInt(1000), () => {
                        pokemon.cry();
                        this.scene.time.delayedCall(Utils.fixedInt(1250), () => {
                          this.scene.tweens.add({
                            targets: this.infoContainer,
                            duration: Utils.fixedInt(750),
                            ease: 'Cubic.easeInOut',
                            x: this.eggHatchBg.displayWidth - 48
                          });

                          this.scene.playSoundWithoutBgm('evolution_fanfare');
                          
                          this.scene.ui.showText(`${pokemon.name} hatched from the egg!`, null, () => {
                            this.scene.gameData.updateSpeciesDexIvs(pokemon.species.speciesId, pokemon.ivs);
                            this.scene.gameData.setPokemonCaught(pokemon).then(() => {
                              this.scene.ui.showText(null, 0);
                              this.end();
                            });
                          }, null, true, 3000);
                          //this.scene.time.delayedCall(Utils.fixedInt(4250), () => this.scene.playBgm());
                        });
                      });
                      this.scene.tweens.add({
                        duration: Utils.fixedInt(3000),
                        targets: this.eggHatchOverlay,
                        alpha: 0,
                        ease: 'Cubic.easeOut'
                      });
                    });
                  });
                });
              });
            })
          });
        });
      });
    });
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
      yOffset++;
      if (trigIndex < 160) {
        particle.setPosition(initialX + (speed * f) / 3, initialY + yOffset);
        particle.y += -this.sin(trigIndex, amp);
        if (f > 108)
          particle.setScale((1 - (f - 108) / 20));
        trigIndex += 2;
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  generatePokemon(): Pokemon {
    let ret: Pokemon;
    let speciesOverride: Species;

    if (this.egg.isManaphyEgg()) {
      this.scene.executeWithSeedOffset(() => {
        const rand = Utils.randSeedInt(8);
  
        speciesOverride = rand ? Species.PHIONE : Species.MANAPHY;
      }, this.egg.id, EGG_SEED.toString());
    } else if (this.egg.tier === ModifierTier.MASTER
      && this.egg.gachaType === GachaType.LEGENDARY) {
      this.scene.executeWithSeedOffset(() => {
        if (!Utils.randSeedInt(2))
          speciesOverride = getLegendaryGachaSpeciesForTimestamp(this.scene, this.egg.timestamp);
      }, this.egg.id, EGG_SEED.toString());
    }

    if (speciesOverride) {
      this.scene.executeWithSeedOffset(() => {
        const pokemonSpecies = getPokemonSpecies(speciesOverride);
        ret = new PlayerPokemon(this.scene, pokemonSpecies, 5, undefined, this.scene.getSpeciesFormIndex(pokemonSpecies, true), undefined, false);
      }, this.egg.id, EGG_SEED.toString());
    } else {
      let minStarterValue: integer;
      let maxStarterValue: integer;

      switch (this.egg.tier) {
        case ModifierTier.GREAT:
          minStarterValue = 4;
          maxStarterValue = 5;
          break;
        case ModifierTier.ULTRA:
          minStarterValue = 6;
          maxStarterValue = 7;
          break;
        case ModifierTier.MASTER:
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
        .filter(s => getPokemonSpecies(s).isObtainable() && ignoredSpecies.indexOf(s) === -1);

      if (this.egg.gachaType === GachaType.TYPE) {
        let tryOverrideType: boolean;

        this.scene.executeWithSeedOffset(() => {
          tryOverrideType = !Utils.randSeedInt(2);
        }, this.egg.id, EGG_SEED.toString());

        if (tryOverrideType) {
          const type = getTypeGachaTypeForTimestamp(this.scene, this.egg.timestamp);
          const typeFilteredSpeciesPool = speciesPool
            .filter(s => getPokemonSpecies(s).isOfType(type));
          if (typeFilteredSpeciesPool.length)
            speciesPool = typeFilteredSpeciesPool;
        }
      }

      let totalWeight = 0;
      const speciesWeights = [];
      for (let speciesId of speciesPool) {
        const weight = Math.floor((((maxStarterValue - speciesStarters[speciesId]) / ((maxStarterValue - minStarterValue) + 1)) * 1.5 + 1) * 100);
        speciesWeights.push(totalWeight + weight);
        totalWeight += weight;
      }

      let species: Species;

      this.scene.executeWithSeedOffset(() => {
        const rand = Utils.randSeedInt(totalWeight);
        for (let s = 0; s < speciesWeights.length; s++) {
          if (rand < speciesWeights[s]) {
            species = speciesPool[s];
            break;
          }
        }

        const pokemonSpecies = getPokemonSpecies(species);

        ret = new PlayerPokemon(this.scene, pokemonSpecies, 5, undefined, this.scene.getSpeciesFormIndex(pokemonSpecies, true), undefined, false);
      }, this.egg.id, EGG_SEED.toString());
    }

    ret.trySetShiny(this.egg.gachaType === GachaType.SHINY ? 1024 : 512);
    
    return ret;
  }
}

export class EndEvolutionPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}