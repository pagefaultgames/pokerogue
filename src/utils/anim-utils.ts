import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";
import type { AnimConfig } from "#data/battle-anims";
import { ImagesFolder } from "#enums/images-folder";
import type { OmitIndexSignature, PickIndexSignature } from "type-fest";

export async function loadAnimAssets(anims: AnimConfig[], startLoad?: boolean): Promise<void> {
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
    await new Promise(resolve => globalScene.load.once(Phaser.Loader.Events.COMPLETE, resolve));
    if (!globalScene.load.isLoading()) {
      globalScene.load.start();
    }
  }
}

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
