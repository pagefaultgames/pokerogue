import Sprite = Phaser.GameObjects.Sprite;
import Frame = Phaser.Textures.Frame;
import Phaser from "phaser";


export default class MockSprite {
  private phaserSprite;
  public pipelineData;
  public texture;
  public key;
  public frame;
  public textureManager;
  public scene;
  public anims;
  public list = [];
  constructor(textureManager, x, y, texture) {
    this.textureManager = textureManager;
    this.scene = textureManager.scene;
    Phaser.GameObjects.Sprite.prototype.setInteractive = this.setInteractive;
    // @ts-ignore
    Phaser.GameObjects.Sprite.prototype.setTexture = this.setTexture;
    Phaser.GameObjects.Sprite.prototype.setSizeToFrame = this.setSizeToFrame;
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
    };
  }

  setTexture(key: string, frame?: string | number) {
    return this;
  }

  setSizeToFrame(frame?: boolean | Frame): Sprite {
    return {} as Sprite;
  }

  setPipeline(obj) {
    // Sets the pipeline of this Game Object.
    return this.phaserSprite.setPipeline(obj);
  }

  off(event, callback, source) {
  }

  setTintFill(color) {
    // Sets the tint fill color.
    return this.phaserSprite.setTintFill(color);
  }

  setScale(scale) {
    return this.phaserSprite.setScale(scale);
  }

  setOrigin(x, y) {
    return this.phaserSprite.setOrigin(x, y);
  }

  setSize(width, height) {
    // Sets the size of this Game Object.
    return this.phaserSprite.setSize(width, height);
  }

  once(event, callback, source) {
    return this.phaserSprite.once(event, callback, source);
  }

  removeFromDisplayList() {
    // same as remove or destroy
    return this.phaserSprite.removeFromDisplayList();
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
    return this.phaserSprite.addedToScene();
  }

  setVisible(visible) {
    return this.phaserSprite.setVisible(visible);
  }

  setPosition(x, y) {
    return this.phaserSprite.setPosition(x, y);
  }

  stop() {
    return this.phaserSprite.stop();
  }

  setInteractive(hitArea, hitAreaCallback, dropZone) {
    return null;
  }

  on(event, callback, source) {
    return this.phaserSprite.on(event, callback, source);
  }

  setAlpha(alpha) {
    return this.phaserSprite.setAlpha(alpha);
  }

  setTint(color) {
    // Sets the tint of this Game Object.
    return this.phaserSprite.setTint(color);
  }

  setFrame(frame, updateSize?: boolean, updateOrigin?: boolean) {
    // Sets the frame this Game Object will use to render with.
    this.frame = frame;
    return frame;
  }

  setPositionRelative(source, x, y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    return this.phaserSprite.setPositionRelative(source, x, y);
  }

  setCrop(x, y, width, height) {
    // Sets the crop size of this Game Object.
    return this.phaserSprite.setCrop(x, y, width, height);
  }

  clearTint() {
    // Clears any previously set tint.
    return this.phaserSprite.clearTint();
  }

  disableInteractive() {
    // Disables Interactive features of this Game Object.
    return null;
  }

  apply() {
    return this.phaserSprite.apply();
  }

  play() {
    // return this.phaserSprite.play();
    return this;
  }

  setPipelineData(key, value) {
    this.pipelineData[key] = value;
  }

  destroy() {
    return this.phaserSprite.destroy();
  }

  setName(name) {
    return this.phaserSprite.setName(name);
  }

  setAngle(angle) {
    return this.phaserSprite.setAngle(angle);
  }

  setMask() {

  }

  add(obj) {
    // Adds a child to this Game Object.
    this.list.push(obj);
  }

  removeAll() {
    // Removes all Game Objects from this Container.
    this.list = [];
  }

  addAt(obj, index) {
    // Adds a Game Object to this Container at the given index.
    this.list.splice(index, 0, obj);
  }

  remove(obj) {
    const index = this.list.indexOf(obj);
    if (index !== -1) {
      this.list.splice(index, 1);
    }
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



}
