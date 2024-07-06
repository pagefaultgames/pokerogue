import { getCachedUrl } from "./utils";

interface AudioCacheEntry {
  key: string;
  filename: string;
  /** timestamp */
  loaded?: number;
  manifest?: unknown;
}

/**
 * Handles audio related stuff like volume and preferences.
 * An instance of it is being exported as `audioManager` and should be used at all times (No need for multiple).
 */
export class AudioManager {
  public static readonly KEY = "audioManager";

  /**
   * Master volume - affects all sounds.
   * Can be incremented/decremented in .1 steps
   * 0.0 = muted
   * 1.0 = max volume
   */
  private _masterVolume: number = 0.5;
  /**
   * Background music volume - affects bgm.
   * Can be incremented/decremented in .1 steps
   * 0 = muted
   * 1 = max volume
   */
  private _bgmVolume: number = 1;
  /**
   * Sound effect volume - affects all sound effects.
   * Can be incremented/decremented in .1 steps
   * 0 = muted
   * 1 = max volume
   */
  private _seVolume: number = 1;
  /**
   * Music preference value.
   * Configurable in settings
   * 0 = consistent
   * 1 = mixed
   */
  private _musicPreference: integer = 0;
  private _load?: Phaser.Loader.LoaderPlugin;
  private bgmCache: AudioCacheEntry[] = [];

  constructor() {}

  public get masterVolume(): number {
    return this._masterVolume;
  }

  public set masterVolume(value: number) {
    this._masterVolume = value;
  }

  public get bgmVolume(): number {
    return this._bgmVolume;
  }

  public set bgmVolume(value: number) {
    this._bgmVolume = value;
  }

  public get seVolume(): number {
    return this._seVolume;
  }

  public set seVolume(value: number) {
    this._seVolume = value;
  }

  public get musicPreference(): integer {
    return this._musicPreference;
  }
  public set musicPreference(value: integer) {
    this._musicPreference = value;
  }

  public get muted(): boolean {
    return (
      this._masterVolume === 0 ||
      (this._bgmVolume === 0 && this._seVolume === 0)
    );
  }

  public get load(): Phaser.Loader.LoaderPlugin {
    return this._load;
  }

  public set load(value: Phaser.Loader.LoaderPlugin) {
    this._load = value;
    if (this._load) {
      this.loadUnloadedBgm();
    }
  }

  loadUnloadedBgm() {
    this.bgmCache.forEach(bgm => {
      this.load.audio(bgm.key, getCachedUrl(`audio/bgm/${bgm.filename}`, bgm.manifest));
      bgm.loaded = Date.now() / 1000; // s, not ms
    });
  }

  loadBgm(key: string, filename?: string, manifest?: unknown) {
    if (!filename) {
      filename = `${key}.mp3`;
    }

    const cacheEntry: AudioCacheEntry = {
      key,
      filename,
      manifest
    };

    if (this.load?.audio) {
      console.debug(
        "AudioManager: Load background music",
        "key:",
        key,
        "filename:",
        filename,
        "muted: ",
        this.muted,
        "load: ",
        this.load
      );
      this.load.audio(key, getCachedUrl(`audio/bgm/${filename}`, manifest));
      cacheEntry.loaded = Date.now() / 1000; // s, not ms
    }

    this.bgmCache.push(cacheEntry);
  }
}

export const audioManager = new AudioManager();
