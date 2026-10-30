import { audioManager } from "#app/global-audio-manager";
import { timedEventManager } from "#app/global-event-manager";
import { coerceArray } from "#utils/array";
import { getCachedUrl } from "#utils/fetch-utils";
import Phaser from "phaser";

export const legacyCompatibleImages: string[] = [];

export class SceneBase extends Phaser.Scene {
  /**
   * Since everything is scaled up by 6 by default using the game.canvas is annoying
   * Until such point that we use the canvas normally, this will be easier than
   * having to divide every width and heigh by 6 to position and scale the ui
   * @readonly
   * @defaultValue
   * width: `320`
   * height: `180`
   */
  public readonly scaledCanvas = {
    width: 320, // (1920 / 6)
    height: 180, // (1080 / 6)
  } as const;

  public init(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD, (file: Phaser.Loader.File) => {
      if (file.key.endsWith("_legacy")) {
        const fileKey = file.key.slice(0, -7);
        legacyCompatibleImages.push(fileKey);
      }
    });
  }

  public loadImage(key: string, folder: string, filename = `${key}.png`): this {
    const eventReplacment = timedEventManager.getEventImageReplacement(key);
    if (eventReplacment) {
      folder = "events";
      filename = `${eventReplacment}.png`;
    }
    this.load.image(key, getCachedUrl(`images/${folder}/${filename}`));
    if (folder.startsWith("ui")) {
      folder = folder.replace("ui", "ui/legacy");
      this.load.image(`${key}_legacy`, getCachedUrl(`images/${folder}/${filename}`));
    }
    return this;
  }

  public loadSpritesheet(key: string, folder: string, size: number, filename = `${key}.png`): this {
    this.load.spritesheet(key, getCachedUrl(`images/${folder}/${filename}`), {
      frameWidth: size,
      frameHeight: size,
    });
    if (folder.startsWith("ui")) {
      folder = folder.replace("ui", "ui/legacy");
      this.load.spritesheet(`${key}_legacy`, getCachedUrl(`images/${folder}/${filename}`), {
        frameWidth: size,
        frameHeight: size,
      });
    }
    return this;
  }

  public loadAtlas(key: string, folder: string, filenameRoot = key): this {
    if (folder) {
      folder += "/";
    }
    const eventReplacment = timedEventManager.getEventImageReplacement(key);
    if (eventReplacment) {
      folder = "events/";
      filenameRoot = `${eventReplacment}`;
    }
    this.load.atlas(
      key,
      getCachedUrl(`images/${folder}${filenameRoot}.png`),
      getCachedUrl(`images/${folder}${filenameRoot}.json`),
    );
    if (folder.startsWith("ui")) {
      folder = folder.replace("ui", "ui/legacy");
      this.load.atlas(
        `${key}_legacy`,
        getCachedUrl(`images/${folder}${filenameRoot}.png`),
        getCachedUrl(`images/${folder}${filenameRoot}.json`),
      );
    }
    return this;
  }

  public loadSe(key: string, folder = "se", filenames: string | string[] = `${key}.wav`): this {
    if (!audioManager.isAudioEnabled) {
      return this;
    }

    folder += "/";

    filenames = coerceArray(filenames);
    for (const f of filenames as string[]) {
      // TODO: Use actual path joining logic
      this.load.audio(folder + key, getCachedUrl(`audio/${folder}${f}`));
    }
    return this;
  }

  public async loadBgm(key: string): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    const completeEvent = `filecomplete-audio-${key}`;

    const onComplete = () => {
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      resolve();
    };

    const onError = (file: Phaser.Loader.File) => {
      if (file.key === key) {
        this.load.off(completeEvent, onComplete);
        this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
        reject(new Error(`Failed to load BGM: ${key}`));
      }
    };

    this.load.once(completeEvent, onComplete);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    this.load.start();

    return await promise;
  }

  /**
   * Load a BGM file as compressed bytes for streaming.
   * This allows the game to either decode on demand, or
   * fallback to normal loading if streaming is not supported on the device.
   * @param key - The name of the audio file as it appears in the `audio/bgm` directory (without the file extension)
   * @param extension - (Default `"mp3"`) File extension to load
   * @returns A promise that resolves to the loaded ArrayBuffer of the BGM file
   */
  public async loadBgmBytes(key: string, extension = "mp3"): Promise<ArrayBuffer> {
    const cached: ArrayBuffer | undefined = this.cache.binary.get(key);
    if (cached != null) {
      return cached;
    }

    this.load.binary(key, getCachedUrl(`audio/bgm/${key}.${extension}`));
    const { promise, resolve, reject } = Promise.withResolvers<ArrayBuffer>();

    const completeEvent = `filecomplete-binary-${key}`;
    const onComplete = (_key: string, _type: string, data: ArrayBuffer) => {
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      resolve(data);
    };
    const onError = (file: Phaser.Loader.File) => {
      if (file.key === key) {
        this.load.off(completeEvent, onComplete);
        this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
        reject(new Error(`Failed to load BGM bytes: ${key}`));
      }
    };
    this.load.once(completeEvent, onComplete);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    this.load.start();
    return await promise;
  }
}
