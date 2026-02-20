import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";
import type { Except } from "type-fest";

/**
 * Argument type for {@linkcode playTween},
 * containing all attributes of {@linkcode Phaser.Types.Tweens.TweenBuilderConfig | TweenBuilderConfig}
 * save for ones related to the `onComplete` callback.
 * @internal
 */
interface PlayTweenConfig
  extends Except<
    Phaser.Types.Tweens.TweenBuilderConfig,
    "onComplete" | "onCompleteParams",
    { requireExactProps: true }
  > {}

/**
 * Play a Tween animation and wait for its animation to complete.
 * @param config - The config for a single Tween
 * @param scene - (Default {@linkcode globalScene}) The {@linkcode SceneBase} on which the Tween should play
 * @returns A Promise that resolves once the Tween has been played.
 * @remarks
 * This is the preferred way to use Phaser's Tween system when simultaneous animations are not needed.
 */
export async function playTween(config: PlayTweenConfig, scene: SceneBase = globalScene): Promise<void> {
  await new Promise(resolve =>
    scene.tweens.add({
      ...config,
      onComplete: resolve,
    }),
  );
}
