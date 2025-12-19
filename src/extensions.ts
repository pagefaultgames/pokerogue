import "phaser";

//#region Methods/Interfaces

/**
 * Interface representing an object that can be passed to {@linkcode setPositionRelative}.
 */
interface GuideObject
  extends Pick<Phaser.GameObjects.Components.ComputedSize, "width" | "height">,
    Pick<Phaser.GameObjects.Components.Transform, "x" | "y">,
    Pick<Phaser.GameObjects.Components.Origin, "originX" | "originY"> {}

/**
 * Set this object's position relative to another object with a given offset.
 * @param guideObject - The object to base this object's position off of; must have defined
 * x/y co-ordinates, an origin and width/height
 * @param x - The X-position to set, relative to `guideObject`'s `x` value
 * @param y - The Y-position to set, relative to `guideObject`'s `y` value
 * @returns `this`
 */
function setPositionRelative<T extends Phaser.GameObjects.Components.Transform>(
  this: T,
  guideObject: GuideObject,
  x: number,
  y: number,
): T {
  const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
  const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
  return this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
}

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

//#endregion

//#region Declaration Merging

interface hasSetPositionRelative {
  /**
   * Set this object's position relative to another object with a given offset.
   * @param guideObject - The object to base this object's position off of; must have defined
   * x/y co-ordinates, an origin and width/height
   * @param x - The X-position to set, relative to `guideObject`'s `x` value
   * @param y - The Y-position to set, relative to `guideObject`'s `y` value
   * @returns `this`
   */
  setPositionRelative: typeof setPositionRelative;
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
}

//#endregion
