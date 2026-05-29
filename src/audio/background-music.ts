import { globalScene } from "#app/global-scene";
import type { AnySound } from "#audio/audio-manager";
import { fixedInt } from "#utils/common";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

/**
 * Class representing a single background music track.
 *
 * @remarks
 * Operations on a BGM object may be deferred for an indefinite amount of time
 * until the underlying Phaser sound object loads. It is not possible to preload these
 * sounds as they are massive. For this reason, a BGM object is liable to be destroyed
 * before any/all of these operations complete, including the music actually starting.
 * The exception is callbacks registered to {@linkcode onEnd}, which will always run regardless
 * of if the music is able to start and stop cleanly.
 */
export class BackgroundMusic {
  /** The key for the audio file */
  public readonly key: string;

  /** The underlying sound instance used to stream music. */
  private sound: AnySound | undefined;
  /** Whether this BGM has been evicted from memory. */
  private destroyed = false;
  /** Operations queued before the sound finished loading. */
  private readonly pendingCalls: (() => void)[] = [];
  /** Callbacks registered via {@linkcode onEnd}, awaiting the end of the track or destruction. */
  private readonly endCallbacks: (() => void)[] = [];
  /** Whether this track has ended (either naturally or via {@linkcode destroy}). */
  private ended = false;

  /** @returns Whether this BGM is currently playing. */
  public get isPlaying(): boolean {
    return !this.destroyed && (this.sound?.isPlaying ?? false);
  }

  /** @returns Whether this BGM is currently paused mid-playback. */
  public get isPaused(): boolean {
    return !this.destroyed && this.sound != null && !this.sound.isPlaying && this.sound.seek > 0;
  }

  /**
   * @param key - The bgm to use
   * @param loop - Whether to loop the bgm
   * @param loopPoint - (Default `0`) The starting point of the loop, in seconds
   */
  constructor(key: string, loop: boolean, loopPoint = 0) {
    this.key = key;

    globalScene
      .loadBgm(key)
      .then(() => {
        if (this.destroyed) {
          return;
        }
        this.sound = globalScene.sound.add(key, { loop });
        if (loop) {
          this.sound.on("looped", () => {
            if (!this.destroyed) {
              this.sound?.play({ seek: loopPoint });
            }
          });
        } else {
          this.sound.once("complete", () => this.triggerEnd());
          // Defensive, "complete" should be the right event but Phaser docs aren't very clear
          this.sound.once("stop", () => this.triggerEnd());
        }
        this.runPendingCalls();
      })
      .catch(() => this.destroy());
  }

  public play(volume?: number): void {
    this.withSound(sound => {
      if (volume != null) {
        this.setVolume(volume);
      }

      if (!sound.isPlaying) {
        sound.play();
      }
    });
  }

  /**
   * Begin playing after `delay` real-time milliseconds.
   * @param delay - The delay before play in milliseconds (speed-sensitive unless `FixedInt` is passed)
   * @param volume - Volume to play at
   */
  public playAfterDelay(delay: number, volume?: number): void {
    globalScene.time.delayedCall(delay, () => {
      if (!this.destroyed) {
        this.play(volume);
      }
    });
  }

  public stop(): void {
    this.withSound(sound => sound.stop());
  }

  public pause(): void {
    this.withSound(sound => sound.pause());
  }

  public resume(): void {
    this.withSound(sound => {
      if (sound.isPlaying) {
        return;
      }
      if (sound.isPaused) {
        sound.resume();
      } else {
        sound.play();
      }
    });
  }

  public setVolume(value: number): void {
    this.withSound(sound => sound.setVolume(Phaser.Math.Clamp(value, 0, 1)));
  }

  /**
   * Add a callback to run when this track ends.
   *
   * @remarks
   * Callbacks added here are guaranteed to run exactly once, so operations like
   * phase transitions on BGM end are safe.
   *
   * @param callback - The callback to run
   */
  public onEnd(callback: () => void): void {
    if (this.ended) {
      callback();
      return;
    }
    this.endCallbacks.push(callback);
  }

  /** Fire all pending {@linkcode onEnd} callbacks exactly once. */
  private triggerEnd(): void {
    if (this.ended) {
      return;
    }
    this.ended = true;
    const callbacks = this.endCallbacks.splice(0);
    for (const cb of callbacks) {
      cb();
    }
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.pendingCalls.length = 0;
    this.triggerEnd();
    if (this.sound?.isPlaying) {
      this.sound.stop();
    }
    globalScene.sound.removeByKey(this.key);
    globalScene.cache.audio.remove(this.key);
  }

  public fadeOut(duration: number, fixed = false): void {
    const realDuration = fixed ? fixedInt(duration) : duration;
    this.withSound(sound => {
      SoundFade.fadeOut(globalScene, sound, realDuration, true);
    });
    globalScene.time.delayedCall(realDuration, () => {
      if (!this.destroyed) {
        this.destroy();
      }
    });
  }

  /**
   * Run an operation immediately, or defer it until the sound has loaded.
   * @param operation - The function to run on ready
   */
  private withSound(operation: (sound: AnySound) => void): void {
    if (this.destroyed) {
      return;
    }
    if (this.sound) {
      operation(this.sound);
      return;
    }
    this.pendingCalls.push(() => {
      if (!this.destroyed) {
        operation(this.sound!);
      }
    });
  }

  /**
   * Run and clear pending operations, stopping if the object is destroyed
   */
  private runPendingCalls(): void {
    const calls = this.pendingCalls.splice(0);
    for (const c of calls) {
      if (this.destroyed) {
        break;
      }
      c();
    }
  }
}
