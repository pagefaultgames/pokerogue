import type { FixedInt } from "#utils/common";

type FixedIntFadeIn = (
  ...args:
    | [
        scene: Phaser.Scene,
        sound: string | Phaser.Sound.BaseSound,
        duration: number | FixedInt,
        endVolume?: number | undefined,
        startVolume?: number | undefined,
      ]
    | [
        sound: string | Phaser.Sound.BaseSound,
        duration: number | FixedInt,
        endVolume?: number | undefined,
        startVolume?: number | undefined,
      ]
) => Phaser.Sound.BaseSound;

type FixedIntFadeOut = (
  ...args:
    | [
        scene: Phaser.Scene,
        sound: string | Phaser.Sound.BaseSound,
        duration: number | FixedInt,
        destroy?: boolean | undefined,
      ]
    | [sound: string | Phaser.Sound.BaseSound, duration: number | FixedInt, destroy?: boolean | undefined]
) => Phaser.Sound.BaseSound;

export let fadeIn: FixedIntFadeIn;
export let fadeOut: FixedIntFadeOut;

export function initSoundFadeOverride(newFadeIn: FixedIntFadeIn, newFadeOut: FixedIntFadeOut): void {
  fadeIn = newFadeIn;
  fadeOut = newFadeOut;
}
