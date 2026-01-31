import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";
import type { OmitIndexSignature, PickIndexSignature } from "type-fest";

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
