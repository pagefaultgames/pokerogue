/// <reference types="phaser" />

/**
 * Defines custom extensions of phaser interfaces and types
 */
declare module "phaser" {
  interface Game {
    /**
     * Manifest object e.g. for cache busting
     */
    manifest?: unknown;
  }

  namespace Loader {
    interface LoaderPlugin {
      /**
       * Manifest object e.g. for cache busting
       */
      manifest?: unknown;
    }
  }
}
