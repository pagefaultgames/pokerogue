import { allDefaultAtlasAssets, allDefaultBgmAssets, allDefaultImageAssets, allDefaultSeAssets } from "#app/default-assets";
import CanvasTexture = Phaser.Textures.CanvasTexture;

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
    width: 1920 / 6,
    height: 1080 / 6
  };
  constructor(config?: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  getCachedUrl(url: string): string {
    const manifest = this.game["manifest"];
    if (manifest) {
      const timestamp = manifest[`/${url}`];
      if (timestamp) {
        url += `?t=${timestamp}`;
      }
    }
    return url;
  }

  loadImage(key: string, folder: string, filename?: string) {
    if (!filename) {
      filename = `${key}.png`;
    }
    this.load.image(key, this.getCachedUrl(`images/${folder}/${filename}`));
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.image(`${key}_legacy`, this.getCachedUrl(`images/${folder}/${filename}`));
    }
  }

  loadSpritesheet(key: string, folder: string, size: integer, filename?: string) {
    if (!filename) {
      filename = `${key}.png`;
    }
    this.load.spritesheet(key, this.getCachedUrl(`images/${folder}/${filename}`), { frameWidth: size, frameHeight: size });
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.spritesheet(`${key}_legacy`, this.getCachedUrl(`images/${folder}/${filename}`), { frameWidth: size, frameHeight: size });
    }
  }

  loadAtlas(key: string, folder: string, filenameRoot?: string) {
    if (!filenameRoot) {
      filenameRoot = key;
    }
    if (folder) {
      folder += "/";
    }
    this.load.atlas(key, this.getCachedUrl(`images/${folder}${filenameRoot}.png`), this.getCachedUrl(`images/${folder}${filenameRoot}.json`));
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.atlas(`${key}_legacy`, this.getCachedUrl(`images/${folder}${filenameRoot}.png`), this.getCachedUrl(`images/${folder}${filenameRoot}.json`));
    }
  }

  loadSe(key: string, folder?: string, filenames?: string | string[]) {
    if (!filenames) {
      filenames = `${key}.wav`;
    }
    if (!folder) {
      folder = "se/";
    } else {
      folder += "/";
    }
    if (!Array.isArray(filenames)) {
      filenames = [ filenames ];
    }
    for (const f of filenames as string[]) {
      this.load.audio(folder+key, this.getCachedUrl(`audio/${folder}${f}`));
    }
  }

  loadBgm(key: string, filename?: string) {
    if (!filename) {
      filename = `${key}.mp3`;
    }
    this.load.audio(key, this.getCachedUrl(`audio/bgm/${filename}`));
  }

  logLocalStorageSize() {
    let _lsTotal = 0;
    let _xLen, _x;
    for (_x in localStorage) {
      if (!localStorage.hasOwnProperty(_x)) {
        continue;
      }
      _xLen = ((localStorage[_x].length + _x.length) * 2);
      _lsTotal += _xLen;
      // console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB");
    }
    console.log("Estimated localStorage: " + (_lsTotal / 1024).toFixed(2) + " KB");
  }

  logSessionStorageSize() {
    let _lsTotal = 0;
    let _xLen, _x;
    for (_x in sessionStorage) {
      if (!sessionStorage.hasOwnProperty(_x)) {
        continue;
      }
      _xLen = ((sessionStorage[_x].length + _x.length) * 2);
      _lsTotal += _xLen;
      // console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB");
    }
    console.log("Estimated sessionStorage: " + (_lsTotal / 1024).toFixed(2) + " KB");
  }

  async logPartitionedStorageSize() {
    const storageEstimate = await navigator.storage.estimate();
    const storagePercent = ((storageEstimate.usage ?? 0) / (storageEstimate.quota ?? 1) * 100).toFixed(2);
    const storageUse = ((storageEstimate.usage ?? 0) / 1024 ).toFixed(2) + "kB";
    const storageMax = ((storageEstimate.quota ?? 0) / 1024 / 1024).toFixed(2) + "MB";
    console.log(`Estimated partitioned storage usage: ${storageUse} (${storagePercent}%) of ${storageMax}`);
  }

  protected async clearAssets(excludedAudioKeys: Set<string>, excludedImageKeys: Set<string>, excludedGraphicsKeys: Set<string>) {
    const storageEstimate = await navigator.storage.estimate();
    console.log("Estimated cache usage: " + JSON.stringify(storageEstimate));
    this.logLocalStorageSize();

    await this.clearAllAudio(excludedAudioKeys);

    await this.clearAllImages(new Set([...excludedImageKeys, ... excludedGraphicsKeys]));

    const newStorageEstimate = await navigator.storage.estimate();
    console.log("Estimated cache usage: " + JSON.stringify(newStorageEstimate));
    this.logLocalStorageSize();
  }

  private async clearAllAudio(excludedAudioKeys: Set<string>) {
    let removedAssets = "";
    for (const key of this.cache.audio.entries.keys()) {
      const audioKey = key as string;
      const keyWithoutFolder = audioKey.split("/").pop();
      if (allDefaultBgmAssets.has(audioKey) || (keyWithoutFolder && allDefaultSeAssets.has(keyWithoutFolder))) {
        // Default audio asset, don't unload
        continue;
      }

      if (excludedAudioKeys.has(audioKey) || (keyWithoutFolder && excludedAudioKeys.has(keyWithoutFolder))) {
        // Asset in use by one of the player's party Pokemon, don't unload
        continue;
      }

      if (this.cache.audio.has(audioKey)) {
        removedAssets += `${audioKey}\n`;
        this.cache.audio.remove(audioKey);
      }
    }

    console.log(`Audio keys removed from cache:\n${removedAssets}`);
  }

  private async clearAllImages(excludedImageKeys: Set<string>) {
    let removedAssets = "";
    for (const textureProperty of Object.keys(this.textures.list)) {
      const texture = this.textures.get(textureProperty);
      if (!texture || texture instanceof CanvasTexture || ["__NORMAL", "__DEFAULT", "__MISSING", "__WHITE"].includes(texture.key)) {
        continue;
      }

      const imageKey = texture.key;

      // const keyWithoutFolder = imageKey.split("/").pop();
      if (allDefaultImageAssets.has(imageKey) || allDefaultAtlasAssets.has(imageKey)) {
        // Default image/atlas asset, don't unload
        continue;
      }

      if (excludedImageKeys.has(imageKey)) {
        // Asset in use by one of the player's party Pokemon, don't unload
        continue;
      }

      if (texture.source.some(s => (s.source as any)?.currentSrc.includes(".mp4"))) {
        // Cached image from a video, skip
        continue;
      }

      const removeLegacySuffix = imageKey.replace("_legacy", "");
      if (legacyCompatibleImages.includes(imageKey) || legacyCompatibleImages.includes(removeLegacySuffix)) {
        // UI image, skip
        continue;
      }

      if (imageKey.includes("pkmn__")) {
        // TODO: figure out why Pokemon assets being reloaded into TextureManager breaks
        // Skip all Pokemon asset removal
        continue;
      }

      if (this.textures.exists(imageKey)) {
        removedAssets += `${imageKey}\n`;
        this.textures.remove(imageKey);
      }
    }

    console.log(`Image keys removed from cache:\n${removedAssets}`);
  }
}
