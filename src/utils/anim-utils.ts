import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";
import type { Except, OmitIndexSignature, PickIndexSignature } from "type-fest";

type OmitWithoutIndex<O extends object, K extends keyof O> = PickIndexSignature<O> & Omit<OmitIndexSignature<O>, K>;

interface PlayTweenConfig
  extends OmitWithoutIndex<Phaser.Types.Tweens.TweenBuilderConfig, "onComplete" | "onCompleteParams"> {}

/**
 * Play a Tween animation and wait for its animation to complete.
 * @param config - The config for a single Tween
 * @param scene - (Default {@linkcode globalScene}) The {@linkcode SceneBase} on which the Tween plays
 * @returns A Promise that resolves once the Tween has been played.
 */
export async function playTween(config: PlayTweenConfig, scene: SceneBase = globalScene): Promise<void> {
  await new Promise(resolve =>
    scene.tweens.add({
      ...config,
      onComplete: resolve,
    }),
  );
}

interface NumberTweenConfig
  extends Except<
    Phaser.Types.Tweens.NumberTweenBuilderConfig,
    "onUpdate" | "onUpdateParams" | "onComplete" | "onCompleteParams" | "onStart" | "onStartParams"
  > {}

/**
 * Iterate over the values produced by a Number Tween's updating.
 * @param config - The config for a single Tween
 * @param scene - (Default {@linkcode globalScene}) The {@linkcode SceneBase} on which the Tween should play
 * @returns An async generator over the values produced by the tween's update process.
 */
export async function* playNumberTween(
  config: NumberTweenConfig,
  scene: SceneBase = globalScene,
): AsyncGenerator<number> {
  const queue: number[] = [];
  let done = false;
  let waitFunc: (() => void) | null = null;

  // make the tween & wait for it to start, hooking into its update/completion commands
  await new Promise<Phaser.Tweens.Tween>(resolve => {
    scene.tweens.addCounter({
      ...config,
      onStart: t => resolve(t),
      onUpdate: (_tween, _target, _key, curr) => {
        queue.push(curr);
        waitFunc?.();
        waitFunc = null;
      },
      onComplete: () => {
        done = true;
        waitFunc?.();
        waitFunc = null;
      },
    });
  });

  while (!done) {
    while (queue.length > 0) {
      yield queue.shift()!;
    }

    const { promise, resolve } = Promise.withResolvers<void>();
    waitFunc = resolve;
    await promise;
  }
}
