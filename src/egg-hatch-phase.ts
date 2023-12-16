import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlePhase } from "./battle-phase";
import BattleScene, { AnySound } from "./battle-scene";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { Egg } from "./data/egg";
import EggHatchSceneHandler from "./ui/egg-hatch-scene-handler";
import { ModifierTier } from "./modifier/modifier-type";
import { Species } from "./data/species";
import Pokemon, { PlayerPokemon } from "./pokemon";
import { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";

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

  constructor(scene: BattleScene, egg: Egg) {
    super(scene);

    this.egg = egg;
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.EGG_HATCH_SCENE).then(() => {

      if (!this.egg)
        return this.end();

      this.scene.fadeOutBgm(null, false);

      const eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

      this.eggHatchContainer = eggHatchHandler.eggHatchContainer;

      this.eggHatchBg = this.scene.add.image(0, 0, 'default_bg');
      this.eggHatchBg.setOrigin(0, 0);
      this.eggHatchContainer.add(this.eggHatchBg);

      this.eggContainer = this.scene.add.container(this.eggHatchBg.displayWidth / 2, this.eggHatchBg.displayHeight / 2);

      this.eggSprite = this.scene.add.sprite(0, 0, 'egg', `egg_${this.egg.tier}`);
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

      const pokemon = this.generatePokemon();
      const preName = pokemon.name;

      console.log(preName, pokemon);

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
                    SoundFade.fadeOut(this.scene, evolutionBgm, 100);
                    for (let e = 0; e < 5; e++)
                      this.scene.time.delayedCall(375 * e, () => this.scene.playSound('egg_hatch', { volume: 1 - (e * 0.2) }));
                    this.eggLightraysOverlay.setVisible(true);
                    this.eggLightraysOverlay.play('egg_lightrays');
                    this.scene.tweens.add({
                      duration: 125,
                      targets: this.eggHatchOverlay,
                      alpha: 1,
                      ease: 'Cubic.easeIn'
                    });
                    this.scene.time.delayedCall(1500, () => {
                      this.eggContainer.setVisible(false);
                      this.pokemonSprite.play(pokemon.getSpriteKey(true));
                      this.pokemonSprite.setVisible(true);
                      this.scene.time.delayedCall(1000, () => pokemon.cry());
                      this.scene.tweens.add({
                        duration: 3000,
                        targets: this.eggHatchOverlay,
                        alpha: 0,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                          this.scene.time.delayedCall(1000, () => this.end());
                        }
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
    const particle = this.scene.add.image(initialX, initialY, 'egg_shard', `${this.egg.tier}_${Math.floor(trigIndex / 2)}`);
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
    let minStarterValue: integer;
    let maxStarterValue: integer;

    switch (this.egg.tier) {
      case ModifierTier.GREAT:
        minStarterValue = 3;
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
        maxStarterValue = 2;
        break;
    }

    const speciesPool = Object.keys(speciesStarters)
      .filter(s => speciesStarters[s] >= minStarterValue && speciesStarters[s] <= maxStarterValue)
      .map(s => parseInt(s) as Species)
      .filter(s => getPokemonSpecies(s).isObtainable());

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
    }, this.egg.id);

    console.log(species, totalWeight);

    const pokemon = new PlayerPokemon(this.scene, getPokemonSpecies(species), 5, null, null);

    return pokemon;
  }
}

export class EndEvolutionPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}