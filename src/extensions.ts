import "phaser";

// #region Types

/**
 * Interface representing an object that can be passed to {@linkcode setPositionRelative}.
 */
interface GuideObject
  extends Pick<Phaser.GameObjects.Components.ComputedSize, "width" | "height">,
    Pick<Phaser.GameObjects.Components.Transform, "x" | "y">,
    Pick<Phaser.GameObjects.Components.Origin, "originX" | "originY"> {}

// #endregion Types

// #region Original Functions

const originalPlay = Phaser.GameObjects.Sprite.prototype.play;
const originalStop = Phaser.GameObjects.Sprite.prototype.stop;

// #endregion Original Functions

// #region Augmented Functions

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

function play<T extends Phaser.GameObjects.Sprite>(
  this: T,
  key: string | Phaser.Animations.Animation | Phaser.Types.Animations.PlayAnimationConfig,
  ignoreIfPlaying?: boolean,
): Phaser.GameObjects.Sprite {
  try {
    return originalPlay.call(this, key, ignoreIfPlaying);
  } catch (err: unknown) {
    console.error(`Failed to play animation for "${key}"!`, err);
    return this;
  }
}

function stop<T extends Phaser.GameObjects.Sprite>(this: T): Phaser.GameObjects.Sprite {
  try {
    return originalStop.call(this);
  } catch (err: unknown) {
    console.error("Failed to stop animation!", err);
    return this;
  }
}

// #endregion Augmented Functions

// #region Extensions

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

Phaser.GameObjects.Sprite.prototype.play = play;
Phaser.GameObjects.Sprite.prototype.stop = stop;

// #endregion Extensions

// #region Declaration Merging

interface HasSetPositionRelative {
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
    interface Container extends HasSetPositionRelative {}
    interface Sprite extends HasSetPositionRelative {}
    interface Image extends HasSetPositionRelative {}
    interface NineSlice extends HasSetPositionRelative {}
    interface Text extends HasSetPositionRelative {}
    interface Rectangle extends HasSetPositionRelative {}
  }
}

// #endregion Declaration Merging
