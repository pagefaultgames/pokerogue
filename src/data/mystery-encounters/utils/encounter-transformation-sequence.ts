import { globalScene } from "#app/global-scene";
import { getTypeRgb } from "#data/type";
import type { PlayerPokemon } from "#field/pokemon";

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
// TODO: Refactor into an async function with `playTween`
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
        globalScene.animations.doSpiralUpward(transformationBaseBg, transformationContainer, xOffset, yOffset);
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
              globalScene.animations.doArcDownward(transformationBaseBg, transformationContainer, xOffset, yOffset);
              globalScene.time.delayedCall(1000, () => {
                pokemonEvoTintSprite.setScale(0.25);
                pokemonEvoTintSprite.setVisible(true);
                globalScene.animations.doCycle(1.5, 6, pokemonTintSprite, pokemonEvoTintSprite).then(() => {
                  pokemonEvoSprite.setVisible(true);
                  globalScene.animations.doCircleInward(
                    transformationBaseBg,
                    transformationContainer,
                    xOffset,
                    yOffset,
                  );

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
