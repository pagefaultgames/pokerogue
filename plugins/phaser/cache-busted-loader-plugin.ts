import { globalManifest } from "../../src/globals/global-manifest";
import { coerceArray } from "../../src/utils/array";
import { getCachedUrl } from "../../src/utils/fetch-utils";

export class CacheBustedLoaderPlugin extends Phaser.Loader.LoaderPlugin {
  addFile(files: Phaser.Loader.File | Phaser.Loader.File[]): void {
    files = coerceArray(files);
    const manifest = globalManifest;

    if (!manifest) {
      super.addFile(files);
      return;
    }

    for (const item of files) {
      if (typeof item.url !== "string") {
        continue;
      }

      item.url = getCachedUrl(item.url.replace(/\/\//g, "/"));
    }

    super.addFile(files);
  }
}
