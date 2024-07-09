import { AnySound } from "#app/battle-scene";
import { eventBus } from "#app/event-bus";
import { BgmChangedEvent } from "#app/events/audio/bgm-changed-event";
import { BgmVolumeChangedEvent } from "#app/events/audio/bgm-volume-changed-event";
import { MasterVolumeChangedEvent } from "#app/events/audio/master-volume-changed-event";
import {
  Setting,
  SettingKeys,
  settingIndex,
} from "#app/system/settings/settings";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { fixedInt, getCachedUrl, getUnixTimestamp } from "../utils";
import { BGM_LOOP_POINT } from "./bgm-loop-point";

interface FilesCacheEntry {
  key: string;
  filename: string;
  /** timestamp (s) when audio was loaded. undefined = pending */
  timestamp?: number;
}

interface SoundConfig {
  volume?: number;
  rate?: number;
}

export class AudioHandlerScene extends Phaser.Scene {
  public static readonly KEY: string = "audioHandler";
  public static readonly BGM_BASE_PATH: string = "audio/bgm";
  public static readonly EVENT_MASTER_VOLUME_CHANGED = "audio/master/volume";

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
  /**
   * Current playing background music track (in loop usually)
   */
  private _bgm: AnySound;
  /**
   * Cache of BGM files. Contains pending ones as well
   */
  private readonly bgmFilesCache: FilesCacheEntry[] = [];
  /**
   * Cache of BGM names that have been loaded
   * Might become deprecated in the future (replaced by bgmFilesCache)? To be considered
   */
  private readonly bgmCache: Set<string> = new Set();
  /**
   * Holds the current BGM name. Used e.g. to play the BGM when music was unmuted
   */
  private _currentBgmName: string;
  /**
   * TODO: doc
   */
  private bgmResumeTimer: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: AudioHandlerScene.KEY, active: true });
  }

  public async create() {
    eventBus.on(
      BgmVolumeChangedEvent.NAME,
      this.handleBgmVolumeChanged.bind(this)
    );
    eventBus.on(
      MasterVolumeChangedEvent.NAME,
      this.handleMasterVolumeChanged.bind(this)
    );
  }

  public async destroy() {
    eventBus.off(BgmVolumeChangedEvent.NAME, this.handleBgmVolumeChanged.bind(this));
  }

  public get masterVolume(): number {
    return this._masterVolume;
  }

  public set masterVolume(value: number) {
    this._masterVolume = value;
    eventBus.emit(new MasterVolumeChangedEvent(value));
  }

  public get bgmVolume(): number {
    return this._bgmVolume;
  }

  public set bgmVolume(value: number) {
    this._bgmVolume = value;
    eventBus.emit(new BgmVolumeChangedEvent(value));
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
      this.masterVolume === 0 || (this.bgmVolume === 0 && this.seVolume === 0)
    );
  }

  public get bgmMuted(): boolean {
    return this.masterVolume === 0 || this.bgmVolume === 0;
  }

  public get bgm(): AnySound {
    return this._bgm;
  }

  public set bgm(value: AnySound) {
    this._bgm = value;
  }

  public get currentBgmName(): string {
    return this._currentBgmName;
  }

  public set currentBgmName(value: string) {
    this._currentBgmName = value;
    eventBus.emit(new BgmChangedEvent(value));
  }

  /**
   * loads audio settings from localStorage
   */
  public loadSettings(): void {
    console.debug("load audio settings");
    const lsSettings = localStorage.getItem("settings");

    if (!lsSettings) {
      return;
    }

    const settings = JSON.parse(localStorage.getItem("settings"));

    for (const setting of Object.keys(settings)) {
      const value = settings[setting];
      const index = settingIndex(setting);

      switch (Setting[index].key) {
      case SettingKeys.Master_Volume:
        this.masterVolume = value
          ? parseInt(Setting[index].options[value].value) * 0.01
          : 0;
        this.updateSoundVolume();
        break;
      case SettingKeys.BGM_Volume:
        this.bgmVolume = value
          ? parseInt(Setting[index].options[value].value) * 0.01
          : 0;
        this.updateSoundVolume();
        break;
      case SettingKeys.SE_Volume:
        this.seVolume = value
          ? parseInt(Setting[index].options[value].value) * 0.01
          : 0;
        this.updateSoundVolume();
        break;
      }
    }
  }

  /**
   * Get BGM volume multiplied by master volume
   *
   * @returns total volume
   */
  public getTotalBgmVolume(): number {
    return this.bgmVolume * this.masterVolume;
  }

  /**
   * Get SE volume multiplied by master volume
   *
   * @returns total volume
   */
  public getTotalSeVolume(): number {
    return this.seVolume * this.masterVolume;
  }

  /**
   * Loads all bgm files that have not been loaded yet (timestamp = undefined)
   */
  public loadPendingBgmFiles(): void | never {
    if (!this.load.audio) {
      throw new Error("load.audio is not defined!");
    }
    console.debug("loading pending bgm files");

    const pendingBgmFiles = this.bgmFilesCache.filter(
      ({ timestamp }) => !timestamp
    );

    if (pendingBgmFiles.length === 0) {
      return;
    }

    pendingBgmFiles.forEach((bgmFileEntry) => {
      const { key, filename } = bgmFileEntry;
      const path = `${AudioHandlerScene.BGM_BASE_PATH}/${filename}`;
      const url = getCachedUrl(path, this.game.manifest);

      console.debug("Load bgm file", key, filename);
      this.load.audio(key, url);
      bgmFileEntry.timestamp = getUnixTimestamp();
    });
    this.playBgm(this.currentBgmName);
  }

  /**
   * Loads a bgm file if loading is ready and bgm is not muted.
   * Otherwise it will be stored as pending and loaded as soon as sound is unmuted
   *
   * @param key bgm file key
   * @param filename optional filename of the bgm file
   */
  public loadBgmFile(key: string, filename?: string) {
    if (!filename) {
      filename = `${key}.mp3`;
    }

    const cacheEntry: FilesCacheEntry = { key, filename };

    if (this.load?.audio && !this.bgmMuted) {
      const path = `${AudioHandlerScene.BGM_BASE_PATH}/${filename}`;
      const url = getCachedUrl(path, this.game.manifest);

      console.debug("Load bgm file", key, url);
      this.load.audio(key, url);
      cacheEntry.timestamp = getUnixTimestamp();
    } else {
      console.debug("Prepare bgm file", cacheEntry);
    }

    this.bgmFilesCache.push(cacheEntry);
  }

  /**
   * Play the passed BGM unless sound it muted
   *
   * @param bgmName name of the BGM
   * @param fadeOut true = fade out effect should be applied
   */
  public playBgm(bgmName?: string, fadeOut?: boolean) {
    console.log("playBgm", bgmName, fadeOut, this.bgmMuted);
    this.currentBgmName = bgmName;
    if (this.bgmMuted) {
      return;
    }

    console.debug(`play bgm (fade: ${fadeOut}): `, bgmName);
    if (this.bgm && bgmName === this.bgm.key) {
      if (!this.bgm.isPlaying) {
        console.log("play");
        this.bgm.play({ volume: this.getTotalBgmVolume() });
      }
      return;
    }
    if (fadeOut && !this.bgm) {
      fadeOut = false;
    }
    this.bgmCache.add(bgmName);

    const loopPoint = this.getBgmLoopPoint(bgmName);
    let loaded = false;

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      loaded = true;
      if (!fadeOut || !this.bgm.isPlaying) {
        this.playNewBgm(bgmName, loopPoint);
      }
    });
    this.loadBgmFile(bgmName);
    if (fadeOut) {
      const onBgmFaded = () => {
        if (loaded && (!this.bgm.isPlaying || this.bgm.pendingRemove)) {
          this.playNewBgm(bgmName, loopPoint);
        }
      };
      this.time.delayedCall(this.fadeOutBgm(500, true) ? 750 : 250, onBgmFaded);
    }
    if (!this.load.isLoading()) {
      this.load.start();
    }
  }

  /**
   * Update the volume of all currently playing sounds
   */
  public updateSoundVolume(): void {
    if (this.sound) {
      for (const sound of this.sound.getAllPlaying()) {
        if (this.bgmCache.has(sound.key)) {
          (sound as AnySound).setVolume(this.getTotalBgmVolume());
        } else {
          (sound as AnySound).setVolume(this.getTotalSeVolume());
        }
      }
    }
  }

  public isBgmPlaying(): boolean {
    return this.bgm && this.bgm.isPlaying;
  }

  /**
   * Handles fading out the current BGM
   *
   * @param duration fade out duration
   * @param destroy if true, the BGM will be "destroyed"
   * @returns true if the BGM was faded out, false otherwise
   */
  public fadeOutBgm(duration: integer = 500, destroy: boolean = true): boolean {
    if (!this.bgm) {
      return false;
    }
    const bgm = this.sound
      .getAllPlaying()
      .find((bgm) => bgm.key === this.bgm.key);
    if (bgm) {
      SoundFade.fadeOut(this, this.bgm, duration, destroy);
      return true;
    }

    return false;
  }

  /**
   * Plays a sound effect without pausing the BGM.
   * If you want to pause the BGM pelase refer to {@linkcode playSoundWithoutBgm}).
   *
   * @param sound name of the sound or sound object
   * @param config optional sound config (e.g. volume/rate)
   * @returns sound object
   */
  playSound(sound: string | AnySound, config?: SoundConfig): AnySound {
    if (config) {
      if (config.hasOwnProperty("volume")) {
        config["volume"] *= this.getTotalSeVolume();
      } else {
        config["volume"] = this.getTotalSeVolume();
      }
    } else {
      config = { volume: this.getTotalSeVolume() };
    }
    // PRSFX sounds are mixed too loud
    if ((typeof sound === "string" ? sound : sound.key).startsWith("PRSFX- ")) {
      config["volume"] *= 0.5;
    }
    if (typeof sound === "string") {
      this.sound.play(sound, config);
      return this.sound.get(sound) as AnySound;
    } else {
      sound.play(config);
      return sound;
    }
  }

  /**
   * Plays a sound effect without BGM playing (BGM pause -> resume).
   * If you want to play BGM, please refer to {@linkcode playSound}.
   *
   * @param soundName name of the sound to play
   * @param pauseDuration optional delay before the bgm is resumed
   * @returns sound object
   */
  public playSoundWithoutBgm(
    soundName: string,
    pauseDuration?: integer
  ): AnySound {
    this.bgmCache.add(soundName);
    const resumeBgm = this.pauseBgm();
    this.playSound(soundName);
    const sound = this.sound.get(soundName) as AnySound;
    if (this.bgmResumeTimer) {
      this.bgmResumeTimer.destroy();
    }
    if (resumeBgm) {
      this.bgmResumeTimer = this.time.delayedCall(
        pauseDuration || fixedInt(sound.totalDuration * 1000),
        () => {
          this.resumeBgm();
          this.bgmResumeTimer = null;
        }
      );
    }
    return sound;
  }

  private playNewBgm(bgmName?: string, loopPoint?: number) {
    console.debug("playNewBgm", bgmName, loopPoint);
    this.currentBgmName = bgmName;

    if (this.bgmMuted) {
      return;
    }

    // this.ui.bgmBar.setBgmToBgmBar(bgmName); TODO: handle this via events instead of coding it wildly into stuff
    if (bgmName === null && this.bgm && !this.bgm.pendingRemove) {
      this.bgm.play({
        volume: this.getTotalBgmVolume(),
      });
      return;
    }
    if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying) {
      this.bgm.stop();
    }
    this.bgm = this.sound.add(bgmName, { loop: true });
    this.bgm.play({
      volume: this.getTotalBgmVolume(),
    });
    if (loopPoint) {
      this.bgm.on("looped", () => this.bgm.play({ seek: loopPoint }));
    }
  }

  private getBgmLoopPoint(bgmName: string): number {
    return BGM_LOOP_POINT[bgmName] ?? 0;
  }

  private pauseBgm(): boolean {
    if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying) {
      this.bgm.pause();
      return true;
    }
    return false;
  }

  private resumeBgm(): boolean {
    if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPaused) {
      this.bgm.resume();
      return true;
    }
    return false;
  }

  private handleMasterVolumeChanged({ volume }: MasterVolumeChangedEvent) {
    if (volume > 0 && !this.bgmMuted) {
      this.loadPendingBgmFiles();
    }
  }

  private handleBgmVolumeChanged({ volume }: BgmVolumeChangedEvent) {
    if (volume > 0 && !this.bgmMuted) {
      this.loadPendingBgmFiles();
    }
  }
}
