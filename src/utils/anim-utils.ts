import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";

/**
 * Plays a Tween animation, resolving once the animation completes.
 * @param config - The config for a single Tween
 * @param scene - The {@linkcode SceneBase} on which the Tween plays; default {@linkcode globalScene}
 * @returns A Promise that resolves once the Tween has been played.
 *
 * @privateRemarks
 * The `config` input should not include an `onComplete` field as that callback is
 * used to resolve the Promise containing the Tween animation.
 * However, `config`'s type cannot be changed to something like `Omit<TweenBuilderConfig, "onComplete">`
 * due to how the type for `TweenBuilderConfig` is defined.
 */
export async function playTween(
  config: Phaser.Types.Tweens.TweenBuilderConfig,
  scene: SceneBase = globalScene,
): Promise<void> {
  await new Promise(resolve =>
    scene.tweens.add({
      ...config,
      onComplete: resolve,
    }),
  );
}
