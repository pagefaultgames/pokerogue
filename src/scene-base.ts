import { atlasAsset, imageAsset, queueAssetRequest, seAsset, spritesheetAsset } from "#app/asset-requests";
import { audioManager } from "#app/global-audio-manager";
import type { AssetRequest } from "#types/asset-set";
import { getCachedUrl } from "#utils/fetch-utils";

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
    return this.queueAssets(imageAsset(key, folder, filename));
  }

  public loadSpritesheet(key: string, folder: string, size: number, filename = `${key}.png`): this {
    return this.queueAssets(spritesheetAsset(key, folder, size, filename));
  }

  public loadAtlas(key: string, folder: string, filenameRoot = key): this {
    return this.queueAssets(atlasAsset(key, folder, filenameRoot));
  }

  public loadSe(key: string, folder = "se", filenames: string | string[] = `${key}.wav`): this {
    if (!audioManager.isAudioEnabled) {
      return this;
    }

    return this.queueAssets(seAsset(key, folder, filenames));
  }

  /**
   * Queue the given requests on this scene's loader, without tracking them.
   * Assets loaded this way are never unloaded; use the asset manager for anything that should be.
   * @param requests - The requests to queue
   */
  protected queueAssets(requests: readonly AssetRequest[]): this {
    for (const request of requests) {
      queueAssetRequest(this.load, request);
    }
    return this;
  }

  public async loadBgm(key: string): Promise<void> {
    if (!audioManager.isAudioEnabled || this.cache.audio.exists(key)) {
      return;
    }

    this.load.audio(key, getCachedUrl(`audio/bgm/${key}.mp3`));
    await new Promise<void>((resolve, reject) => {
      const onError = (file: Phaser.Loader.File) => {
        if (file.key === key) {
          this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
          reject(new Error(`Failed to load BGM: ${key}`));
        }
      };
      this.load.once(`filecomplete-audio-${key}`, () => {
        this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
        resolve();
      });
      this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      this.load.start();
    });
  }
}
