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
    const yOffset = screenPosition === TransformationScreenPosition.CENTER ? 0 : -15;

    const getPokemonSprite = () => {
      const ret = globalScene.addPokemonSprite(
        previousPokemon,
        transformationBaseBg.displayWidth / 2 + xOffset,
        transformationBaseBg.displayHeight / 2 + yOffset,
        "pkmn__sub",
      );
      ret
        .setRenderNodeRole("Submitter", globalScene.spriteSubmitter, {
          tone: [0.0, 0.0, 0.0, 0.0],
          ignoreTimeTint: true,
        })
        .setRenderNodeRole("BatchHandler", globalScene.spriteBatchHandler);
      return ret;
    };

    transformationContainer.add((pokemonSprite = getPokemonSprite()));
    transformationContainer.add((pokemonTintSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoTintSprite = getPokemonSprite()));

    pokemonSprite.setAlpha(0);
    pokemonTintSprite.setAlpha(0);
    pokemonTintSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    pokemonEvoSprite.setVisible(false);
    pokemonEvoTintSprite.setVisible(false);
    pokemonEvoTintSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);

    [pokemonSprite, pokemonTintSprite, pokemonEvoSprite, pokemonEvoTintSprite].forEach(sprite => {
      const spriteKey = previousPokemon.getSpriteKey(true);
      sprite.play(spriteKey);

      sprite.setRenderNodeRole("Submitter", globalScene.spriteSubmitter, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: false,
        teraColor: getTypeRgb(previousPokemon.getTeraType()),
        isTerastallized: previousPokemon.isTerastallized,
        ignoreTimeTint: true,
        spriteKey: previousPokemon.getSpriteKey(),
        shiny: previousPokemon.shiny,
        variant: previousPokemon.variant,
      });
      ["spriteColors", "fusionSpriteColors"].forEach(k => {
        if (previousPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.renderNodeData[globalScene.spriteSubmitter.name][k] =
          previousPokemon.getSprite().renderNodeData[globalScene.spriteSubmitter.name][k];
      });
    });

    [pokemonEvoSprite, pokemonEvoTintSprite].forEach(sprite => {
      const spriteKey = transformPokemon.getSpriteKey(true);
      sprite.play(spriteKey);

      sprite
        .setRenderNodeData(globalScene.spriteSubmitter, "ignoreTimeTint", true)
        .setRenderNodeData(globalScene.spriteSubmitter, "spriteKey", transformPokemon.getSpriteKey())
        .setRenderNodeData(globalScene.spriteSubmitter, "shiny", transformPokemon.shiny)
        .setRenderNodeData(globalScene.spriteSubmitter, "variant", transformPokemon.variant);
      ["spriteColors", "fusionSpriteColors"].forEach(k => {
        if (transformPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.setRenderNodeData(
          globalScene.spriteSubmitter,
          k,
          transformPokemon.getSprite().renderNodeData[globalScene.spriteSubmitter.name][k],
        );
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
