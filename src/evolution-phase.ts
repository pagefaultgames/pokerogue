import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { Phase } from "./phase";
import BattleScene from "./battle-scene";
import { SpeciesFormEvolution } from "./data/pokemon-evolutions";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { LearnMovePhase } from "./phases";
import { cos, sin } from "./field/anims";
import { PlayerPokemon } from "./field/pokemon";
import { getTypeRgb } from "./data/type";

export class EvolutionPhase extends Phase {
  protected pokemon: PlayerPokemon;
  protected lastLevel: integer;
  
  private evolution: SpeciesFormEvolution;

  protected evolutionContainer: Phaser.GameObjects.Container;
  protected evolutionBaseBg: Phaser.GameObjects.Image;
  protected evolutionBg: Phaser.GameObjects.Video;
  protected evolutionBgOverlay: Phaser.GameObjects.Rectangle;
  protected evolutionOverlay: Phaser.GameObjects.Rectangle;
  protected pokemonSprite: Phaser.GameObjects.Sprite;
  protected pokemonTintSprite: Phaser.GameObjects.Sprite;
  protected pokemonEvoSprite: Phaser.GameObjects.Sprite;
  protected pokemonEvoTintSprite: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, pokemon: PlayerPokemon, evolution: SpeciesFormEvolution, lastLevel: integer) {
    super(scene);

    this.pokemon = pokemon;
    this.evolution = evolution;
    this.lastLevel = lastLevel;
  }

  validate(): boolean {
    return !!this.evolution;
  }

  setMode(): Promise<void> {
    return this.scene.ui.setModeForceTransition(Mode.EVOLUTION_SCENE);
  }

  start() {
    super.start();

    this.setMode().then(() => {

      if (!this.validate())
        return this.end();

      this.scene.fadeOutBgm(null, false);

      const evolutionHandler = this.scene.ui.getHandler() as EvolutionSceneHandler;

      this.evolutionContainer = evolutionHandler.evolutionContainer;

      this.evolutionBaseBg = this.scene.add.image(0, 0, 'default_bg');
      this.evolutionBaseBg.setOrigin(0, 0);
      this.evolutionContainer.add(this.evolutionBaseBg);

      this.evolutionBg = this.scene.add.video(0, 0, 'evo_bg').stop();
      this.evolutionBg.setOrigin(0, 0);
      this.evolutionBg.setScale(0.4359673025);
      this.evolutionBg.setVisible(false);
      this.evolutionContainer.add(this.evolutionBg);

      this.evolutionBgOverlay = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x262626);
      this.evolutionBgOverlay.setOrigin(0, 0);
      this.evolutionBgOverlay.setAlpha(0);
      this.evolutionContainer.add(this.evolutionBgOverlay);

      const getPokemonSprite = () => {
        const ret = this.scene.addPokemonSprite(this.pokemon, this.evolutionBaseBg.displayWidth / 2, this.evolutionBaseBg.displayHeight / 2, `pkmn__sub`);
        ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
        return ret;
      };

      this.evolutionContainer.add((this.pokemonSprite = getPokemonSprite()));
      this.evolutionContainer.add((this.pokemonTintSprite = getPokemonSprite()));
      this.evolutionContainer.add((this.pokemonEvoSprite = getPokemonSprite()));
      this.evolutionContainer.add((this.pokemonEvoTintSprite = getPokemonSprite()));

      this.pokemonTintSprite.setAlpha(0);
      this.pokemonTintSprite.setTintFill(0xFFFFFF);
      this.pokemonEvoSprite.setVisible(false);
      this.pokemonEvoTintSprite.setVisible(false);
      this.pokemonEvoTintSprite.setTintFill(0xFFFFFF);

      this.evolutionOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, (this.scene.game.canvas.height / 6) - 48, 0xFFFFFF);
      this.evolutionOverlay.setOrigin(0, 0);
      this.evolutionOverlay.setAlpha(0);
      this.scene.ui.add(this.evolutionOverlay);

      [ this.pokemonSprite, this.pokemonTintSprite, this.pokemonEvoSprite, this.pokemonEvoTintSprite ].map(sprite => {
        sprite.play(this.pokemon.getSpriteKey(true));
        sprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: false, teraColor: getTypeRgb(this.pokemon.getTeraType()) });
        sprite.setPipelineData('ignoreTimeTint', true);
        sprite.setPipelineData('spriteKey', this.pokemon.getSpriteKey());
        sprite.setPipelineData('shiny', this.pokemon.shiny);
        sprite.setPipelineData('variant', this.pokemon.variant);
        [ 'spriteColors', 'fusionSpriteColors' ].map(k => {
          if (this.pokemon.summonData?.speciesForm)
            k += 'Base';
          sprite.pipelineData[k] = this.pokemon.getSprite().pipelineData[k];
        });
      });

      this.doEvolution();
    });
  }

  doEvolution(): void {
    const evolutionHandler = this.scene.ui.getHandler() as EvolutionSceneHandler;
    const preName = this.pokemon.name;
    
    this.scene.ui.showText(`What?\n${preName} is evolving!`, null, () => {
      this.pokemon.cry();

      this.pokemon.getPossibleEvolution(this.evolution).then(evolvedPokemon => {

        [ this.pokemonEvoSprite, this.pokemonEvoTintSprite ].map(sprite => {
          sprite.play(evolvedPokemon.getSpriteKey(true));
          sprite.setPipelineData('ignoreTimeTint', true);
          sprite.setPipelineData('spriteKey', evolvedPokemon.getSpriteKey());
          sprite.setPipelineData('shiny', evolvedPokemon.shiny);
          sprite.setPipelineData('variant', evolvedPokemon.variant);
          [ 'spriteColors', 'fusionSpriteColors' ].map(k => {
            if (evolvedPokemon.summonData?.speciesForm)
              k += 'Base';
            sprite.pipelineData[k] = evolvedPokemon.getSprite().pipelineData[k];
          });
        });

        this.scene.time.delayedCall(1000, () => {
          const evolutionBgm = this.scene.playSoundWithoutBgm('evolution');
          this.scene.tweens.add({
            targets: this.evolutionBgOverlay,
            alpha: 1,
            delay: 500,
            duration: 1500,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.scene.time.delayedCall(1000, () => {
                this.scene.tweens.add({
                  targets: this.evolutionBgOverlay,
                  alpha: 0,
                  duration: 250
                });
                this.evolutionBg.setVisible(true);
                this.evolutionBg.play();
              });
              this.scene.playSound('charge');
              this.doSpiralUpward();
              this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 2000,
                onUpdate: t => {
                  this.pokemonTintSprite.setAlpha(t.getValue());
                },
                onComplete: () => {
                  this.pokemonSprite.setVisible(false);
                  this.scene.time.delayedCall(1100, () => {
                    this.scene.playSound('beam');
                    this.doArcDownward();
                    this.scene.time.delayedCall(1500, () => {
                      this.pokemonEvoTintSprite.setScale(0.25);
                      this.pokemonEvoTintSprite.setVisible(true);
                      evolutionHandler.canCancel = true;
                      this.doCycle(1).then(success => {
                        if (!success) {

                          this.pokemonSprite.setVisible(true);
                          this.pokemonTintSprite.setScale(1);
                          this.scene.tweens.add({
                            targets: [ this.evolutionBg, this.pokemonTintSprite, this.pokemonEvoSprite, this.pokemonEvoTintSprite ],
                            alpha: 0,
                            duration: 250,
                            onComplete: () => {
                              this.evolutionBg.setVisible(false);
                            }
                          });

                          SoundFade.fadeOut(this.scene, evolutionBgm, 100);

                          this.scene.unshiftPhase(new EndEvolutionPhase(this.scene));

                          this.scene.ui.showText(`${preName} stopped evolving.`, null, () => {
                            this.scene.ui.showText(`Would you like to pause evolutions for ${preName}?\nEvolutions can be re-enabled from the party screen.`, null, () => {
                              const end = () => {
                                this.scene.ui.showText(null, 0);
                                this.scene.playBgm();
                                evolvedPokemon.destroy();
                                this.end();
                              };
                              this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
                                this.scene.ui.revertMode();
                                this.pokemon.pauseEvolutions = true;
                                this.scene.ui.showText(`Evolutions have been paused for ${preName}.`, null, end, 3000);
                              }, () => {
                                this.scene.ui.revertMode();
                                this.scene.time.delayedCall(3000, end);
                              });
                            });
                          }, null, true);
                          return;
                        }
                        
                        this.scene.playSound('sparkle');
                        this.pokemonEvoSprite.setVisible(true);
                        this.doCircleInward();
                        this.scene.time.delayedCall(900, () => {
                          evolutionHandler.canCancel = false;

                          this.pokemon.evolve(this.evolution).then(() => {
                            const levelMoves = this.pokemon.getLevelMoves(this.lastLevel + 1, true);
                            for (let lm of levelMoves)
                              this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.scene.getParty().indexOf(this.pokemon), lm[1]));  
                            this.scene.unshiftPhase(new EndEvolutionPhase(this.scene));

                            this.scene.playSound('shine');
                            this.doSpray();
                            this.scene.tweens.add({
                              targets: this.evolutionOverlay,
                              alpha: 1,
                              duration: 250,
                              easing: 'Sine.easeIn',
                              onComplete: () => {
                                this.evolutionBgOverlay.setAlpha(1);
                                this.evolutionBg.setVisible(false);
                                this.scene.tweens.add({
                                  targets: [ this.evolutionOverlay, this.pokemonEvoTintSprite ],
                                  alpha: 0,
                                  duration: 2000,
                                  delay: 150,
                                  easing: 'Sine.easeIn',
                                  onComplete: () => {
                                    this.scene.tweens.add({
                                      targets: this.evolutionBgOverlay,
                                      alpha: 0,
                                      duration: 250,
                                      onComplete: () => {
                                        SoundFade.fadeOut(this.scene, evolutionBgm, 100);
                                        this.scene.time.delayedCall(250, () => {
                                          this.pokemon.cry();
                                          this.scene.time.delayedCall(1250, () => {
                                            this.scene.playSoundWithoutBgm('evolution_fanfare');
                                            
                                            evolvedPokemon.destroy();
                                            this.scene.ui.showText(`Congratulations!\nYour ${preName} evolved into ${this.pokemon.name}!`, null, () => this.end(), null, true, Utils.fixedInt(4000));
                                            this.scene.time.delayedCall(Utils.fixedInt(4250), () => this.scene.playBgm());
                                          });
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          });
                        });
                      });
                    });
                  });
                }
              })
            }
          });
        });
      });
    }, 1000);
  }

  doSpiralUpward() {
    let f = 0;
      
    this.scene.tweens.addCounter({
      repeat: 64,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        if (f < 64) {
          if (!(f & 7)) {
            for (let i = 0; i < 4; i++)
              this.doSpiralUpwardParticle((f & 120) * 2 + i * 64);
          }
          f++;
        }
      }
    });
  }

  doArcDownward() {
    let f = 0;
      
    this.scene.tweens.addCounter({
      repeat: 96,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        if (f < 96) {
          if (f < 6) {
            for (let i = 0; i < 9; i++)
              this.doArcDownParticle(i * 16);
          }
          f++;
        }
      }
    });
  }

  doCycle(l: number, lastCycle: integer = 15): Promise<boolean> {
    return new Promise(resolve => {
      const evolutionHandler = this.scene.ui.getHandler() as EvolutionSceneHandler;
      const isLastCycle = l === lastCycle;
      this.scene.tweens.add({
        targets: this.pokemonTintSprite,
        scale: 0.25,
        ease: 'Cubic.easeInOut',
        duration: 500 / l,
        yoyo: !isLastCycle
      });
      this.scene.tweens.add({
        targets: this.pokemonEvoTintSprite,
        scale: 1,
        ease: 'Cubic.easeInOut',
        duration: 500 / l,
        yoyo: !isLastCycle,
        onComplete: () => {
          if (evolutionHandler.cancelled)
            return resolve(false);
          if (l < lastCycle)
            this.doCycle(l + 0.5, lastCycle).then(success => resolve(success));
          else {
            this.pokemonTintSprite.setVisible(false);
            resolve(true);
          }
        }
      });
    });
  }

  doCircleInward() {
    let f = 0;
      
    this.scene.tweens.addCounter({
      repeat: 48,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        if (!f) {
          for (let i = 0; i < 16; i++)
            this.doCircleInwardParticle(i * 16, 4);
        } else if (f === 32) {
          for (let i = 0; i < 16; i++)
            this.doCircleInwardParticle(i * 16, 8);
        }
        f++;
      }
    });
  }

  doSpray() {
    let f = 0;
      
    this.scene.tweens.addCounter({
      repeat: 48,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        if (!f) {
          for (let i = 0; i < 8; i++)
            this.doSprayParticle(i);
        } else if (f < 50)
          this.doSprayParticle(Utils.randInt(8));
        f++;
      }
    });
  }

  doSpiralUpwardParticle(trigIndex: integer) {
    const initialX = this.evolutionBaseBg.displayWidth / 2;
    const particle = this.scene.add.image(initialX, 0, 'evo_sparkle');
    this.evolutionContainer.add(particle);

    let f = 0;
    let amp = 48;

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      if (!f || particle.y > 8) {
        particle.setPosition(initialX, 88 - (f * f) / 80);
        particle.y += sin(trigIndex, amp) / 4;
        particle.x += cos(trigIndex, amp);
        particle.setScale(1 - (f / 80));
        trigIndex += 4;
        if (f & 1)
          amp--;
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  doArcDownParticle(trigIndex: integer) {
    const initialX = this.evolutionBaseBg.displayWidth / 2;
    const particle = this.scene.add.image(initialX, 0, 'evo_sparkle');
    particle.setScale(0.5);
    this.evolutionContainer.add(particle);

    let f = 0;
    let amp = 8;

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      if (!f || particle.y < 88) {
        particle.setPosition(initialX, 8 + (f * f) / 5);
        particle.y += sin(trigIndex, amp) / 4;
        particle.x += cos(trigIndex, amp);
        amp = 8 + sin(f * 4, 40);
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  doCircleInwardParticle(trigIndex: integer, speed: integer) {
    const initialX = this.evolutionBaseBg.displayWidth / 2;
    const initialY = this.evolutionBaseBg.displayHeight / 2;
    const particle = this.scene.add.image(initialX, initialY, 'evo_sparkle');
    this.evolutionContainer.add(particle);

    let amp = 120;

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      if (amp > 8) {
        particle.setPosition(initialX, initialY);
        particle.y += sin(trigIndex, amp);
        particle.x += cos(trigIndex, amp);
        amp -= speed;
        trigIndex += 4;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  doSprayParticle(trigIndex: integer) {
    const initialX = this.evolutionBaseBg.displayWidth / 2;
    const initialY = this.evolutionBaseBg.displayHeight / 2;
    const particle = this.scene.add.image(initialX, initialY, 'evo_sparkle');
    this.evolutionContainer.add(particle);

    let f = 0;
    let yOffset = 0;
    let speed = 3 - Utils.randInt(8);
    let amp = 48 + Utils.randInt(64);

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      if (!(f & 3))
        yOffset++;
      if (trigIndex < 128) {
        particle.setPosition(initialX + (speed * f) / 3, initialY + yOffset);
        particle.y += -sin(trigIndex, amp);
        if (f > 108)
          particle.setScale((1 - (f - 108) / 20));
        trigIndex++;
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }
}

export class EndEvolutionPhase extends Phase {
  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}