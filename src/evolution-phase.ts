import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlePhase } from "./battle-phase";
import BattleScene from "./battle-scene";
import { SpeciesEvolution } from "./data/pokemon-evolutions";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import * as Utils from "./utils";
import { Mode } from "./ui/ui";
import { LearnMovePhase } from "./battle-phases";

export class EvolutionPhase extends BattlePhase {
  private partyMemberIndex: integer;
  private evolution: SpeciesEvolution;
  private lastLevel: integer;

  private evolutionContainer: Phaser.GameObjects.Container;
  private evolutionBaseBg: Phaser.GameObjects.Image;
  private evolutionBg: Phaser.GameObjects.Video;
  private evolutionBgOverlay: Phaser.GameObjects.Rectangle;
  private evolutionOverlay: Phaser.GameObjects.Rectangle;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonTintSprite: Phaser.GameObjects.Sprite;
  private pokemonEvoSprite: Phaser.GameObjects.Sprite;
  private pokemonEvoTintSprite: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, partyMemberIndex: integer, evolution: SpeciesEvolution, lastLevel: integer) {
    super(scene);

    this.partyMemberIndex = partyMemberIndex;
    this.evolution = evolution;
    this.lastLevel = lastLevel;
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.EVOLUTION_SCENE).then(() => {

      if (!this.evolution) {
        this.end();
        return;
      }

      this.scene.fadeOutBgm(null, false);

      this.evolutionContainer = (this.scene.ui.getHandler() as EvolutionSceneHandler).evolutionContainer;

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
        return this.scene.add.sprite(this.evolutionBaseBg.displayWidth / 2, this.evolutionBaseBg.displayHeight / 2, `pkmn__sub`);
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

      this.evolutionOverlay = this.scene.add.rectangle(0, -this.scene.game.canvas.height / 6, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0xFFFFFF);
      this.evolutionOverlay.setOrigin(0, 0);
      this.evolutionOverlay.setAlpha(0);
      this.scene.fieldUI.add(this.evolutionOverlay);

      const pokemon = this.scene.getParty()[this.partyMemberIndex];
      const preName = pokemon.name;

      this.pokemonSprite.play(pokemon.getSpriteKey());
      this.pokemonTintSprite.play(pokemon.getSpriteKey());
      this.pokemonEvoSprite.play(pokemon.getSpriteKey());
      this.pokemonEvoTintSprite.play(pokemon.getSpriteKey());

      this.scene.ui.showText(`What?\n${preName} is evolving!`, null, () => {
        pokemon.cry();

        pokemon.evolve(this.evolution).then(() => {
          this.pokemonEvoSprite.play(pokemon.getSpriteKey());
          this.pokemonEvoTintSprite.play(pokemon.getSpriteKey());
        });

        const levelMoves = pokemon.getLevelMoves(this.lastLevel + 1);
        for (let lm of levelMoves)
          this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm));  
        this.scene.unshiftPhase(new EndEvolutionPhase(this.scene));

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
                      this.doCycle(1).then(() => {
                        this.scene.playSound('sparkle');
                        this.pokemonEvoSprite.setVisible(true);
                        this.doCircleInward();
                        this.scene.time.delayedCall(900, () => {
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
                                        pokemon.cry();
                                        this.scene.time.delayedCall(1250, () => {
                                          this.scene.playSoundWithoutBgm('evolution_fanfare');
                                          this.scene.ui.showText(`Congratulations! Your ${preName}\nevolved into ${pokemon.name}!`, null, () => this.end(), null, true, 3000);
                                          this.scene.time.delayedCall(Utils.fixedInt(4250), () => this.scene.playBgm());
                                        });
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          })
                        });
                      });
                    });
                  });
                }
              })
            }
          });
        });
      }, 1000);
    });
  }

  sin(index: integer, amplitude: integer): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  cos(index: integer, amplitude: integer): number {
    return amplitude * Math.cos(index * (Math.PI / 128));
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

  doCycle(l: number): Promise<void> {
    return new Promise(resolve => {
      const isLastCycle = l === 15;
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
          if (l < 15)
            this.doCycle(l + 0.5).then(() => resolve());
          else {
            this.pokemonTintSprite.setVisible(false);
            resolve();
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
        particle.y += this.sin(trigIndex, amp) / 4;
        particle.x += this.cos(trigIndex, amp);
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
        particle.y += this.sin(trigIndex, amp) / 4;
        particle.x += this.cos(trigIndex, amp);
        amp = 8 + this.sin(f * 4, 40);
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
        particle.y += this.sin(trigIndex, amp);
        particle.x += this.cos(trigIndex, amp);
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
        particle.y += -this.sin(trigIndex, amp);
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

export class EndEvolutionPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MESSAGE).then(() => this.end());
  }
}