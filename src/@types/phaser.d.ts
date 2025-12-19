import "phaser";

declare module "phaser" {
  namespace Math {
    interface RandomDataGenerator {
      pick<T>(array: ArrayLike<T>): T;
      weightedPick<T>(array: ArrayLike<T>): T;
    }
  }

  namespace Input {
    namespace Gamepad {
      interface GamepadPlugin {
        /**
         * Refreshes the list of connected Gamepads.
         * This is called automatically when a gamepad is connected or disconnected, and during the update loop.
         */
        refreshPads(): void;
      }
    }
  }

  interface Game {
    /** A manifest used to cache various files requested from the server. */
    manifest?: Record<string, string>;
  }
}
