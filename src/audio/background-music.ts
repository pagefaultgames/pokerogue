import { getCachedUrl } from "#utils/fetch-utils";
import { Howl } from "howler";

/**
 * Stream background music with Howler.
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
  readonly key: string;
  private readonly howl: Howl;
  private destroyed = false;

  public get isPlaying(): boolean {
    return this.howl.playing();
  }

  public get isPaused(): boolean {
    return !this.howl.playing() && (this.howl.seek() as number) > 0;
  }

  constructor(key: string, loop: boolean, loopPoint = 0, onEnd?: () => void) {
    this.key = key;
    const url = getCachedUrl(`audio/bgm/${key}.mp3`);

    this.howl = new Howl({
      src: [url],
      html5: true,
      preload: true,
      onload: () => {
        this.howl["_sprite"].loop = [loopPoint * 1000, this.howl.duration() * 1000 - loopPoint * 1000, true];
      },
    });

    if (onEnd != null) {
      this.howl.on("end", onEnd);
    } else if (loop && loopPoint > 0) {
      this.howl.on("end", this.loopOnEnd.bind(this));
    }
  }

  private loopOnEnd(): void {
    this.howl.stop();
    this.howl.play("loop");
  }

  public play(config?: { volume?: number; seek?: number }): void {
    if (config?.volume !== undefined) {
      this.howl.volume(config.volume);
    }
    if (config?.seek !== undefined) {
      this.howl.seek(config.seek);
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
    this.howl.volume(Math.max(0, Math.min(1, value)));
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.howl.unload();
  }

  public fadeOut(duration: number, destroy: boolean): boolean {
    if (!this.isPlaying) {
      return false;
    }

    const current = this.howl.volume();
    this.howl.fade(current, 0, duration);
    this.howl.once("fade", () => {
      this.stop();
      if (destroy) {
        this.destroy();
      }
    });

    return true;
  }
}
