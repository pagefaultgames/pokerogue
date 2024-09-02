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
}
