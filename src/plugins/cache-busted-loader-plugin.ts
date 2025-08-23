import { coerceArray } from "#utils/common";

let manifest: object;

export class CacheBustedLoaderPlugin extends Phaser.Loader.LoaderPlugin {
  get manifest() {
    return manifest;
  }

  set manifest(manifestObj: object) {
    manifest = manifestObj;
  }

  addFile(file): void {
    file = coerceArray(file);

    file.forEach(item => {
      if (manifest) {
        const timestamp = manifest[`/${item.url.replace(/\/\//g, "/")}`];
        if (timestamp) {
          item.url += `?t=${timestamp}`;
        }
      }
    });

    super.addFile(file);
  }
}
