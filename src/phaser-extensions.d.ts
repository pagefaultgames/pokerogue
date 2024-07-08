/// <reference types="phaser" />

declare module "phaser" {
  interface Game {
    manifest?: unknown;
  }

  namespace Loader {
    interface LoaderPlugin {
      manifest?: unknown;
    }
  }
}
