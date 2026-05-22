import { globalScene } from "#app/global-scene";
import type { AnySound } from "#audio/audio-manager";
import { fixedInt } from "#utils/common";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

/**
 * Class representing a single background music track.
 *
 * @privateRemarks
 * This class is a very thin wrapper, but serves to
 * take some complexity away from BattleScene.
 */
export class BackgroundMusic {
  /** The key for the audio file */
  public readonly key: string;

  /** The underlying sound instance used to stream music. */
  private sound: AnySound | undefined;
  /** Whether this BGM has been evicted from memory. */
  private destroyed = false;
  /** Allow callbacks to be queued even if the sound is not ready */
  private readonly pendingCalls: (() => void)[] = [];

  /** @returns Whether this BGM is currently playing. */
  public get isPlaying(): boolean {
    return this.sound?.isPlaying ?? false;
  }

  /** @returns Whether this BGM is currently paused mid-playback. */
  public get isPaused(): boolean {
    return this.sound != null && !this.sound.isPlaying && this.sound.seek > 0;
  }

  /**
   * @param key - The bgm to use
   * @param loop - Whether to loop the bgm
   * @param loopPoint - (Default `0`) The starting point of the loop, in seconds
   */
  constructor(key: string, loop: boolean, loopPoint = 0) {
    this.key = key;

    globalScene.loadBgm(key).then(() => {
      this.sound = globalScene.sound.add(key, { loop });
      if (loop) {
        this.sound.on("looped", () => this.sound?.play({ seek: loopPoint }));
      }
      this.pendingCalls.forEach(c => c());
    });
  }

  public play(volume?: number): void {
    this.withSound(sound => {
      if (volume != null) {
        this.setVolume(volume);
      }

      sound.play();
    });
  }

  public stop(): void {
    this.withSound(sound => sound.stop());
  }

  public pause(): void {
    this.withSound(sound => sound.pause());
  }

  public resume(): void {
    this.withSound(sound => sound.resume());
  }

  public setVolume(value: number): void {
    this.withSound(sound => sound.setVolume(Phaser.Math.Clamp(value, 0, 1)));
  }

  /**
   * Add a callback to run when this track ends.
   * @param callback - The callback to run
   */
  public onEnd(callback: () => void): void {
    this.withSound(sound => {
      if (sound.isPlaying) {
        sound.on("complete", callback);
      } else {
        callback();
      }
    });
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.pendingCalls.length = 0;
    globalScene.sound.removeByKey(this.key);
    globalScene.cache.audio.remove(this.key);
  }

  public fadeOut(duration: number, fixed = false): void {
    this.withSound(sound => SoundFade.fadeOut(globalScene, sound, fixed ? fixedInt(duration) : duration, true));
  }

  /**
   * Either complete an operation immediately or defer it to when the sound is ready
   * (which should not be long after creation)
   * @param operation - The function to run on ready
   */
  private withSound(operation: (sound: AnySound) => void): void {
    if (this.sound) {
      operation(this.sound);
      return;
    }

    this.pendingCalls.push(() => {
      operation(this.sound!);
    });
  }
}
