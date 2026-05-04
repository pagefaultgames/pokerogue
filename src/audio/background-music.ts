import { getCachedUrl } from "#utils/fetch-utils";
import { Howl } from "howler";

/**
 * Class representing a single background music track being streamed from HTML5 Audio via Howler.
 *
 * This class is separate from and unrelated to Phaser's sound system.
 * @privateRemarks
 * A separate class is used for background music to allow it to be streamed as HTML5 audio
 * rather than being decoded into memory all at once. Considering single BGM tracks can exceed
 * 100 MB decoded, this is extremely significant.
 *
 * It is separate because Phaser does not support using both WebAudio and HTML5 audio
 * in the same project. There is indication that Phaser 4 will support this, at which time
 * this class could be removed and replaced with Phaser's built in support.
 */
export class BackgroundMusic {
  /** The key for the audio file */
  public readonly key: string;

  /** The underlying {@linkcode Howl} instance used to stream music. */
  private readonly howl: Howl;
  /** Whether this BGM has been evicted from memory. */
  private destroyed = false;

  /** @returns Whether this BGM is currently playing. */
  public get isPlaying(): boolean {
    return this.howl.playing();
  }

  /** @returns Whether this BGM is currently paused mid-playback. */
  public get isPaused(): boolean {
    return !this.howl.playing() && (this.howl.seek() as number) > 0;
  }

  /**
   * @param key - The bgm to use
   * @param loop - Whether to loop the bgm
   * @param loopPoint - (Default `0`) The starting point of the loop, in seconds
   */
  constructor(key: string, loop: boolean, loopPoint = 0) {
    this.key = key;
    const url = getCachedUrl(`audio/bgm/${key}.mp3`);

    this.howl = new Howl({
      src: [url],
      html5: true,
      preload: true,
      onload: () => {
        this.howl["_sprite"].loop = [loopPoint * 1000, this.howl.duration() * 1000 - loopPoint * 1000, true];
      },
      onplayerror: () => this.howl.once("unlock", () => this.howl.play()),
    });

    if (loop) {
      this.howl.on("end", this.loopOnEnd.bind(this));
    }
  }

  private loopOnEnd(): void {
    this.howl.stop();
    this.howl.play("loop");
  }

  public play(volume?: number): void {
    if (volume != null) {
      this.setVolume(volume);
    }

    this.howl.play();
  }

  public stop(): void {
    this.howl.stop();
  }

  public pause(): void {
    this.howl.pause();
  }

  public resume(): void {
    this.howl.play();
  }

  public setVolume(value: number): void {
    this.howl.volume(Phaser.Math.Clamp(value, 0, 1));
  }

  /**
   * Add a callback to run when this track ends.
   * @param callback - The callback to run
   *
   * @remarks
   * Note that if a callback is registered to a looping track, it will run on every loop.
   */
  public onEnd(callback: () => void): void {
    this.howl.on("end", callback);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.howl.unload();
  }

  public fadeOut(duration: number): void {
    if (!this.isPlaying || this.destroyed) {
      return;
    }

    const currentVolume = this.howl.volume();
    this.howl.fade(currentVolume, 0, duration);

    this.howl.once("fade", () => {
      this.stop();
      this.destroy();
    });
  }
}
