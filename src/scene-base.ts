import { coerceArray } from "#utils/array";

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

  getCachedUrl(url: string): string {
    const manifest = this.game.manifest;
    if (!manifest) {
      return url;
    }

    // TODO: This is inconsistent with how the battle scene cached fetch
    // uses the manifest
    const timestamp = manifest[`/${url}`];
    if (timestamp) {
      url += `?t=${timestamp}`;
    }
    return url;
  }

  loadImage(key: string, folder: string, filename = `${key}.png`): this {
    this.load.image(key, this.getCachedUrl(`images/${folder}/${filename}`));
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.image(`${key}_legacy`, this.getCachedUrl(`images/${folder}/${filename}`));
    }
    return this;
  }

  loadSpritesheet(key: string, folder: string, size: number, filename = `${key}.png`): this {
    this.load.spritesheet(key, this.getCachedUrl(`images/${folder}/${filename}`), {
      frameWidth: size,
      frameHeight: size,
    });
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.spritesheet(`${key}_legacy`, this.getCachedUrl(`images/${folder}/${filename}`), {
        frameWidth: size,
        frameHeight: size,
      });
    }
    return this;
  }

  loadAtlas(key: string, folder: string, filenameRoot = key): this {
    if (folder) {
      folder += "/";
    }
    this.load.atlas(
      key,
      this.getCachedUrl(`images/${folder}${filenameRoot}.png`),
      this.getCachedUrl(`images/${folder}${filenameRoot}.json`),
    );
    if (folder.startsWith("ui")) {
      legacyCompatibleImages.push(key);
      folder = folder.replace("ui", "ui/legacy");
      this.load.atlas(
        `${key}_legacy`,
        this.getCachedUrl(`images/${folder}${filenameRoot}.png`),
        this.getCachedUrl(`images/${folder}${filenameRoot}.json`),
      );
    }
    return this;
  }

  loadSe(key: string, folder = "se", filenames: string | string[] = `${key}.wav`): this {
    folder += "/";

    filenames = coerceArray(filenames);
    for (const f of filenames as string[]) {
      // TODO: Use actual path joining logic
      this.load.audio(folder + key, this.getCachedUrl(`audio/${folder}${f}`));
    }
    return this;
  }

  loadBgm(key: string, filename = `${key}.mp3`): this {
    this.load.audio(key, this.getCachedUrl(`audio/bgm/${filename}`));
    return this;
  }
}
