import { globalScene } from "#app/global-scene";
import { getTypeRgb } from "#data/type";
import { cos, sin } from "#field/anims";
import type { PlayerPokemon } from "#field/pokemon";
import { getFrameMs } from "#utils/common";

export enum TransformationScreenPosition {
  CENTER,
  LEFT,
  RIGHT,
}

/**
 * Initiates an "evolution-like" animation to transform a previousPokemon (presumably from the player's party) into a new one, not necessarily an evolution species.
 * @param scene
 * @param previousPokemon
 * @param transformPokemon
 * @param screenPosition
 */
export function doPokemonTransformationSequence(
  previousPokemon: PlayerPokemon,
  transformPokemon: PlayerPokemon,
  screenPosition: TransformationScreenPosition,
) {
  return new Promise<void>(resolve => {
    const transformationContainer = globalScene.fieldUI.getByName("Dream Background") as Phaser.GameObjects.Container;
    const transformationBaseBg = globalScene.add.image(0, 0, "default_bg");
    transformationBaseBg.setOrigin(0, 0);
    transformationBaseBg.setVisible(false);
    transformationContainer.add(transformationBaseBg);

    let pokemonSprite: Phaser.GameObjects.Sprite;
    let pokemonTintSprite: Phaser.GameObjects.Sprite;
    let pokemonEvoSprite: Phaser.GameObjects.Sprite;
    let pokemonEvoTintSprite: Phaser.GameObjects.Sprite;

    const xOffset =
      screenPosition === TransformationScreenPosition.CENTER
        ? 0
        : screenPosition === TransformationScreenPosition.RIGHT
          ? 100
          : -100;
    // Centered transformations occur at a lower y Position
    const yOffset = screenPosition !== TransformationScreenPosition.CENTER ? -15 : 0;

    const getPokemonSprite = () => {
      const ret = globalScene.addPokemonSprite(
        previousPokemon,
        transformationBaseBg.displayWidth / 2 + xOffset,
        transformationBaseBg.displayHeight / 2 + yOffset,
        "pkmn__sub",
      );
      ret.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        ignoreTimeTint: true,
      });
      return ret;
    };

    transformationContainer.add((pokemonSprite = getPokemonSprite()));
    transformationContainer.add((pokemonTintSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoTintSprite = getPokemonSprite()));

    pokemonSprite.setAlpha(0);
    pokemonTintSprite.setAlpha(0);
    pokemonTintSprite.setTintFill(0xffffff);
    pokemonEvoSprite.setVisible(false);
    pokemonEvoTintSprite.setVisible(false);
    pokemonEvoTintSprite.setTintFill(0xffffff);

    [pokemonSprite, pokemonTintSprite, pokemonEvoSprite, pokemonEvoTintSprite].map(sprite => {
      const spriteKey = previousPokemon.getSpriteKey(true);
      try {
        sprite.play(spriteKey);
      } catch (err: unknown) {
        console.error(`Failed to play animation for ${spriteKey}`, err);
      }

      sprite.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: false,
        teraColor: getTypeRgb(previousPokemon.getTeraType()),
        isTerastallized: previousPokemon.isTerastallized,
      });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", previousPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", previousPokemon.shiny);
      sprite.setPipelineData("variant", previousPokemon.variant);
      ["spriteColors", "fusionSpriteColors"].map(k => {
        if (previousPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = previousPokemon.getSprite().pipelineData[k];
      });
    });

    [pokemonEvoSprite, pokemonEvoTintSprite].map(sprite => {
      const spriteKey = transformPokemon.getSpriteKey(true);
      try {
        sprite.play(spriteKey);
      } catch (err: unknown) {
        console.error(`Failed to play animation for ${spriteKey}`, err);
      }

      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", transformPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", transformPokemon.shiny);
      sprite.setPipelineData("variant", transformPokemon.variant);
      ["spriteColors", "fusionSpriteColors"].map(k => {
        if (transformPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = transformPokemon.getSprite().pipelineData[k];
      });
    });

    globalScene.tweens.add({
      targets: pokemonSprite,
      alpha: 1,
      ease: "Cubic.easeInOut",
      duration: 2000,
      onComplete: () => {
        doSpiralUpward(transformationBaseBg, transformationContainer, xOffset, yOffset);
        globalScene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 1000,
          onUpdate: t => {
            pokemonTintSprite.setAlpha(t.getValue() ?? 1);
          },
          onComplete: () => {
            pokemonSprite.setVisible(false);
            globalScene.time.delayedCall(700, () => {
              doArcDownward(transformationBaseBg, transformationContainer, xOffset, yOffset);
              globalScene.time.delayedCall(1000, () => {
                pokemonEvoTintSprite.setScale(0.25);
                pokemonEvoTintSprite.setVisible(true);
                doCycle(1.5, 6, pokemonTintSprite, pokemonEvoTintSprite).then(() => {
                  pokemonEvoSprite.setVisible(true);
                  doCircleInward(transformationBaseBg, transformationContainer, xOffset, yOffset);

                  globalScene.time.delayedCall(900, () => {
                    globalScene.tweens.add({
                      targets: pokemonEvoTintSprite,
                      alpha: 0,
                      duration: 1500,
                      delay: 150,
                      easing: "Sine.easeIn",
                      onComplete: () => {
                        globalScene.time.delayedCall(3000, () => {
                          resolve();
                          globalScene.tweens.add({
                            targets: pokemonEvoSprite,
                            alpha: 0,
                            duration: 2000,
                            delay: 150,
                            easing: "Sine.easeIn",
                            onComplete: () => {
                              previousPokemon.destroy();
                              transformPokemon.setVisible(false);
                              transformPokemon.setAlpha(1);
                            },
                          });
                        });
                      },
                    });
                  });
                });
              });
            });
          },
        });
      },
    });
  });
}

/**
 * Animates particles that "spiral" upwards at start of transform animation
 * @param scene
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doSpiralUpward(
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  let f = 0;

  globalScene.tweens.addCounter({
    repeat: 64,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (f < 64) {
        if (!(f & 7)) {
          for (let i = 0; i < 4; i++) {
            doSpiralUpwardParticle(
              (f & 120) * 2 + i * 64,
              transformationBaseBg,
              transformationContainer,
              xOffset,
              yOffset,
            );
          }
        }
        f++;
      }
    },
  });
}

/**
 * Animates particles that arc downwards after the upwards spiral
 * @param scene
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doArcDownward(
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  let f = 0;

  globalScene.tweens.addCounter({
    repeat: 96,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (f < 96) {
        if (f < 6) {
          for (let i = 0; i < 9; i++) {
            doArcDownParticle(i * 16, transformationBaseBg, transformationContainer, xOffset, yOffset);
          }
        }
        f++;
      }
    },
  });
}

/**
 * Animates the transformation between the old pokemon form and new pokemon form
 * @param scene
 * @param l
 * @param lastCycle
 * @param pokemonTintSprite
 * @param pokemonEvoTintSprite
 */
function doCycle(
  l: number,
  lastCycle: number,
  pokemonTintSprite: Phaser.GameObjects.Sprite,
  pokemonEvoTintSprite: Phaser.GameObjects.Sprite,
): Promise<boolean> {
  return new Promise(resolve => {
    const isLastCycle = l === lastCycle;
    globalScene.tweens.add({
      targets: pokemonTintSprite,
      scale: 0.25,
      ease: "Cubic.easeInOut",
      duration: 500 / l,
      yoyo: !isLastCycle,
    });
    globalScene.tweens.add({
      targets: pokemonEvoTintSprite,
      scale: 1,
      ease: "Cubic.easeInOut",
      duration: 500 / l,
      yoyo: !isLastCycle,
      onComplete: () => {
        if (l < lastCycle) {
          doCycle(l + 0.5, lastCycle, pokemonTintSprite, pokemonEvoTintSprite).then(success => resolve(success));
        } else {
          pokemonTintSprite.setVisible(false);
          resolve(true);
        }
      },
    });
  });
}

/**
 * Animates particles in a circle pattern
 * @param scene
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doCircleInward(
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  let f = 0;

  globalScene.tweens.addCounter({
    repeat: 48,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (!f) {
        for (let i = 0; i < 16; i++) {
          doCircleInwardParticle(i * 16, 4, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      } else if (f === 32) {
        for (let i = 0; i < 16; i++) {
          doCircleInwardParticle(i * 16, 8, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      }
      f++;
    },
  });
}

/**
 * Helper function for {@linkcode doSpiralUpward}, handles a single particle
 * @param scene
 * @param trigIndex
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doSpiralUpwardParticle(
  trigIndex: number,
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const particle = globalScene.add.image(initialX, 0, "evo_sparkle");
  transformationContainer.add(particle);

  let f = 0;
  let amp = 48;

  const particleTimer = globalScene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    },
  });

  const updateParticle = () => {
    if (!f || particle.y > 8) {
      particle.setPosition(initialX, 88 - (f * f) / 80 + yOffset);
      particle.y += sin(trigIndex, amp) / 4;
      particle.x += cos(trigIndex, amp);
      particle.setScale(1 - f / 80);
      trigIndex += 4;
      if (f & 1) {
        amp--;
      }
      f++;
    } else {
      particle.destroy();
      particleTimer.remove();
    }
  };

  updateParticle();
}

/**
 * Helper function for {@linkcode doArcDownward}, handles a single particle
 * @param scene
 * @param trigIndex
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doArcDownParticle(
  trigIndex: number,
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const particle = globalScene.add.image(initialX, 0, "evo_sparkle");
  particle.setScale(0.5);
  transformationContainer.add(particle);

  let f = 0;
  let amp = 8;

  const particleTimer = globalScene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    },
  });

  const updateParticle = () => {
    if (!f || particle.y < 88) {
      particle.setPosition(initialX, 8 + (f * f) / 5 + yOffset);
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

/**
 * Helper function for @{link doCircleInward}, handles a single particle
 * @param scene
 * @param trigIndex
 * @param speed
 * @param transformationBaseBg
 * @param transformationContainer
 * @param xOffset
 * @param yOffset
 */
function doCircleInwardParticle(
  trigIndex: number,
  speed: number,
  transformationBaseBg: Phaser.GameObjects.Image,
  transformationContainer: Phaser.GameObjects.Container,
  xOffset: number,
  yOffset: number,
) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const initialY = transformationBaseBg.displayHeight / 2 + yOffset;
  const particle = globalScene.add.image(initialX, initialY, "evo_sparkle");
  transformationContainer.add(particle);

  let amp = 120;

  const particleTimer = globalScene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    },
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
