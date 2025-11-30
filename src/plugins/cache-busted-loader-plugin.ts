import { globalScene } from "#app/global-scene";
import { coerceArray } from "#utils/array";

export class CacheBustedLoaderPlugin extends Phaser.Loader.LoaderPlugin {
  addFile(files: Phaser.Loader.File | Phaser.Loader.File[]): void {
    files = coerceArray(files);
    const { manifest } = globalScene.game;

    if (!manifest) {
      super.addFile(files);
      return;
    }

    for (const item of files) {
      if (typeof item.url !== "string") {
        continue;
      }

      const timestamp = manifest[`/${item.url.replace(/\/\//g, "/")}`];
      if (timestamp) {
        item.url += `?t=${timestamp}`;
      }
    }

    super.addFile(files);
  }
}
