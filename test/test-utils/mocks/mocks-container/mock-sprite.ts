import type { MockGameObject } from "#test/test-utils/mocks/mock-game-object";
import { coerceArray } from "#utils/common";
import Phaser from "phaser";

type Frame = Phaser.Textures.Frame;

export class MockSprite implements MockGameObject {
  private phaserSprite;
  public pipelineData;
  public texture;
  public key;
  public frame;
  public textureManager;
  public scene;
  public anims;
  public list: MockGameObject[] = [];
  public name: string;
  public active = true;
  constructor(textureManager, x, y, texture) {
    this.textureManager = textureManager;
    this.scene = textureManager.scene;
    // @ts-expect-error
    Phaser.GameObjects.Sprite.prototype.setInteractive = this.setInteractive;
    // @ts-expect-error
    Phaser.GameObjects.Sprite.prototype.setTexture = this.setTexture;
    // @ts-expect-error
    Phaser.GameObjects.Sprite.prototype.setSizeToFrame = this.setSizeToFrame;
    // @ts-expect-error
    Phaser.GameObjects.Sprite.prototype.setFrame = this.setFrame;
    // Phaser.GameObjects.Sprite.prototype.disable = this.disable;

    // Phaser.GameObjects.Sprite.prototype.texture = { frameTotal: 1, get: () => null };
    this.phaserSprite = new Phaser.GameObjects.Sprite(textureManager.scene, x, y, texture);
    this.pipelineData = {};
    this.texture = {
      key: texture || "",
    };
    this.anims = {
      pause: () => null,
      stop: () => null,
    };
  }

  setTexture(_key: string, _frame?: string | number): this {
    return this;
  }

  setSizeToFrame(_frame?: boolean | Frame): this {
    return this;
  }

  setPipeline(obj): this {
    // Sets the pipeline of this Game Object.
    this.phaserSprite.setPipeline(obj);
    return this;
  }

  off(_event, _callback, _source): this {
    return this;
  }

  setTintFill(color): this {
    // Sets the tint fill color.
    this.phaserSprite.setTintFill(color);
    return this;
  }

  setScale(scale = 1): this {
    this.phaserSprite.setScale(scale);
    return this;
  }

  setOrigin(x = 0.5, y = x): this {
    this.phaserSprite.setOrigin(x, y);
    return this;
  }

  setSize(width, height): this {
    // Sets the size of this Game Object.
    this.phaserSprite.setSize(width, height);
    return this;
  }

  once(event, callback, source): this {
    this.phaserSprite.once(event, callback, source);
    return this;
  }

  removeFromDisplayList(): this {
    // same as remove or destroy
    this.phaserSprite.removeFromDisplayList();
    return this;
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
    return this.phaserSprite.addedToScene();
  }

  setVisible(visible): this {
    this.phaserSprite.setVisible(visible);
    return this;
  }

  setPosition(x, y): this {
    this.phaserSprite.setPosition(x, y);
    return this;
  }

  setRotation(radians): this {
    this.phaserSprite.setRotation(radians);
    return this;
  }

  stop(): this {
    this.phaserSprite.stop();
    return this;
  }

  setInteractive(): this {
    return this;
  }

  on(event, callback, source): this {
    this.phaserSprite.on(event, callback, source);
    return this;
  }

  setAlpha(alpha): this {
    this.phaserSprite.setAlpha(alpha);
    return this;
  }

  setTint(color): this {
    // Sets the tint of this Game Object.
    this.phaserSprite.setTint(color);
    return this;
  }

  setFrame(frame, _updateSize?: boolean, _updateOrigin?: boolean): this {
    // Sets the frame this Game Object will use to render with.
    this.frame = frame;
    return this;
  }

  setPositionRelative(source, x, y): this {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    this.phaserSprite.setPositionRelative(source, x, y);
    return this;
  }

  setY(y: number): this {
    this.phaserSprite.setY(y);
    return this;
  }

  setFlipY(flip: boolean): this {
    // Sets the vertical flip state of this Game Object.
    this.phaserSprite.setFlipY(flip);
    return this;
  }

  setFlipX(flip: boolean): this {
    this.phaserSprite.setFlipX(flip);
    return this;
  }

  setCrop(x: number, y: number, width: number, height: number): this {
    // Sets the crop size of this Game Object.
    this.phaserSprite.setCrop(x, y, width, height);
    return this;
  }

  clearTint(): this {
    // Clears any previously set tint.
    this.phaserSprite.clearTint();
    return this;
  }

  disableInteractive(): this {
    // Disables Interactive features of this Game Object.
    return this;
  }

  apply() {
    this.phaserSprite.apply();
    return this;
  }

  play(): this {
    // return this.phaserSprite.play();
    return this;
  }

  setPipelineData(key: string, value: any): this {
    this.pipelineData[key] = value;
    return this;
  }

  destroy() {
    return this.phaserSprite.destroy();
  }

  setName(name: string): this {
    this.phaserSprite.setName(name);
    return this;
  }

  setAngle(angle): this {
    this.phaserSprite.setAngle(angle);
    return this;
  }

  setMask(): this {
    return this;
  }

  add(obj: MockGameObject | MockGameObject[]): this {
    // Adds a child to this Game Object.
    this.list.push(...coerceArray(obj));
    return this;
  }

  removeAll() {
    // Removes all Game Objects from this Container.
    this.list = [];
  }

  addAt(obj, index): this {
    // Adds a Game Object to this Container at the given index.
    this.list.splice(index, 0, obj);
    return this;
  }

  remove(obj): this {
    const index = this.list.indexOf(obj);
    if (index !== -1) {
      this.list.splice(index, 1);
    }
    return this;
  }

  getIndex(obj) {
    const index = this.list.indexOf(obj);
    return index || -1;
  }

  getAt(index) {
    return this.list[index];
  }

  getAll() {
    return this.list;
  }

  copyPosition(obj): this {
    this.phaserSprite.copyPosition(obj);
    return this;
  }

  setActive(active: boolean): this {
    this.phaserSprite.setActive(active);
    return this;
  }
}
