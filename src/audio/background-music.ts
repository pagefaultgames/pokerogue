import type { AnySound } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
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
  private readonly sound: AnySound;
  /** Whether this BGM has been evicted from memory. */
  private destroyed = false;

  /** @returns Whether this BGM is currently playing. */
  public get isPlaying(): boolean {
    return this.sound.isPlaying;
  }

  /** @returns Whether this BGM is currently paused mid-playback. */
  public get isPaused(): boolean {
    return !this.sound.isPlaying && this.sound.seek > 0;
  }

  /**
   * @param key - The bgm to use
   * @param loop - Whether to loop the bgm
   * @param loopPoint - (Default `0`) The starting point of the loop, in seconds
   */
  constructor(key: string, loop: boolean, loopPoint = 0) {
    this.key = key;

    this.sound = globalScene.sound.add(key, { loop });
    if (loop) {
      this.sound.on("looped", () => this.sound.play({ seek: loopPoint }));
    }
  }

  public play(volume?: number): void {
    if (volume != null) {
      this.setVolume(volume);
    }

    this.sound.play();
  }

  public stop(): void {
    this.sound.stop();
  }

  public pause(): void {
    this.sound.pause();
  }

  public resume(): void {
    this.sound.play();
  }

  public setVolume(value: number): void {
    this.sound.setVolume(Phaser.Math.Clamp(value, 0, 1));
  }

  /**
   * Add a callback to run when this track ends.
   * @param callback - The callback to run
   *
   * @remarks
   * Note that if a callback is registered to a looping track, it will run on every loop.
   */
  public onEnd(callback: () => void): void {
    this.sound.on("end", callback);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    globalScene.sound.removeByKey(this.key);
    globalScene.cache.audio.remove(this.key);
  }

  public fadeOut(duration: number): void {
    if (!this.isPlaying || this.destroyed) {
      return;
    }

    SoundFade.fadeOut(globalScene, this.sound, duration, true);
  }
}
