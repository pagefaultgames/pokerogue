import { getCachedUrl } from "#utils/fetch-utils";
import { Howl } from "howler";

export class BackgroundMusic {
  readonly key: string;
  private readonly howl: Howl;
  private readonly loopPoint: number;
  private destroyed = false;

  public get isPlaying(): boolean {
    return this.howl.playing();
  }

  public get isPaused(): boolean {
    return !this.howl.playing() && (this.howl.seek() as number) > 0;
  }

  constructor(key: string, loopPoint = 0) {
    this.key = key;
    this.loopPoint = loopPoint;
    const url = getCachedUrl(`audio/bgm/${key}.mp3`);

    this.howl = new Howl({
      src: [url],
      html5: true,
      loop: loopPoint <= 0,
      preload: true,
    });

    if (loopPoint > 0) {
      this.howl.on("end", this.onEnd);
    }
  }

  private readonly onEnd = (): void => {
    this.howl.seek(this.loopPoint);
    this.howl.play();
  };

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
    this.howl.off("end", this.onEnd);
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
