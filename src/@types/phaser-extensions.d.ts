/// <reference types="phaser" />

import { RexImageTransition, RexImageTransitionOptions } from "./rex";

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

  namespace GameObjects {
    interface GameObjectCreator {
      rexTransitionImagePack: (options: RexImageTransitionOptions, arg2?: boolean) => RexImageTransition;
    }
  }
}
