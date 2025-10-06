import "phaser";

/**
 * Interface representing an object that can be passed to {@linkcode setPositionRelative}.
 * @interface
 */
type GuideObject = Pick<Phaser.GameObjects.Components.ComputedSize, "width" | "height"> &
  Pick<Phaser.GameObjects.Components.Transform, "x" | "y"> &
  Pick<Phaser.GameObjects.Components.Origin, "originX" | "originY">;

type setPositionRelative =
  /**
   * Set this object's position relative to another object with a given offset.
   * @param guideObject - The object to base this object's position off of; must have defined
   * x/y co-ordinates, an origin and width/height
   * @param x - The X-position to set, relative to `guideObject`'s `x` value
   * @param y - The Y-position to set, relative to `guideObject`'s `y` value
   * @returns `this`
   */
  <T extends Phaser.GameObjects.Components.Transform>(this: T, guideObject: GuideObject, x: number, y: number) => T;

interface hasSetPositionRelative {
  setPositionRelative: setPositionRelative;
}

declare module "phaser" {
  namespace GameObjects {
    interface Container extends hasSetPositionRelative {}
    interface Sprite extends hasSetPositionRelative {}
    interface Image extends hasSetPositionRelative {}
    interface NineSlice extends hasSetPositionRelative {}
    interface Text extends hasSetPositionRelative {}
    interface Rectangle extends hasSetPositionRelative {}
  }

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
}
