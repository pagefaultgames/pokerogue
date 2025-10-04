import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";
import type { AnimConfig } from "#data/battle-anims";
import { ImagesFolder } from "#enums/images-folder";

export function loadAnimAssets(anims: AnimConfig[], startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    const backgrounds = new Set<string>();
    const sounds = new Set<string>();
    for (const a of anims) {
      if (a.frames == null || a.frames.length === 0) {
        continue;
      }
      const animSounds = a.getSoundResourceNames();
      for (const ms of animSounds) {
        sounds.add(ms);
      }
      const animBackgrounds = a.getBackgroundResourceNames();
      for (const abg of animBackgrounds) {
        backgrounds.add(abg);
      }
      if (a.graphic) {
        globalScene.loadSpritesheet(a.graphic, ImagesFolder.BATTLE_ANIMS, 96);
      }
    }
    for (const bg of backgrounds) {
      globalScene.loadImage(bg, ImagesFolder.BATTLE_ANIMS);
    }
    for (const s of sounds) {
      globalScene.loadSe(s, "battle_anims", s);
    }
    if (startLoad) {
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      if (!globalScene.load.isLoading()) {
        globalScene.load.start();
      }
    } else {
      resolve();
    }
  });
}

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
