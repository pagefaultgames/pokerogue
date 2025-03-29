import type MockTextureManager from "#test/testUtils/mocks/mockTextureManager";
import type { MockGameObject } from "../mockGameObject";

export default class MockContainer implements MockGameObject {
  protected x;
  protected y;
  protected scene;
  protected width;
  protected height;
  protected visible;
  private alpha;
  private style;
  public frame;
  protected textureManager;
  public list: MockGameObject[] = [];
  public name: string;

  constructor(textureManager: MockTextureManager, x, y) {
    this.x = x;
    this.y = y;
    this.frame = {};
    this.textureManager = textureManager;
  }
  setVisible(visible) {
    this.visible = visible;
  }

  once(_event, _callback, _source) {}

  off(_event, _callback, _source) {}

  removeFromDisplayList() {
    // same as remove or destroy
  }

  removeBetween(_startIndex, _endIndex, _destroyChild) {
    // Removes multiple children across an index range
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
  }

  setSize(_width, _height) {
    // Sets the size of this Game Object.
  }

  setMask() {
    /// Sets the mask that this Game Object will use to render with.
  }

  setPositionRelative(_source, _x, _y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
  }

  setInteractive = () => null;

  setOrigin(x, y) {
    this.x = x;
    this.y = y;
  }

  setAlpha(alpha) {
    this.alpha = alpha;
  }

  setFrame(_frame, _updateSize?: boolean, _updateOrigin?: boolean) {
    // Sets the frame this Game Object will use to render with.
  }

  setScale(_scale) {
    // Sets the scale of this Game Object.
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setX(x) {
    this.x = x;
  }

  setY(y) {
    this.y = y;
  }

  destroy() {
    this.list = [];
  }

  setShadow(_shadowXpos, _shadowYpos, _shadowColor) {
    // Sets the shadow settings for this Game Object.
  }

  setLineSpacing(_lineSpacing) {
    // Sets the line spacing value of this Game Object.
  }

  setText(_text) {
    // Sets the text this Game Object will display.
  }

  setAngle(_angle) {
    // Sets the angle of this Game Object.
  }

  setShadowOffset(_offsetX, _offsetY) {
    // Sets the shadow offset values.
  }

  setWordWrapWidth(_width) {
    // Sets the width (in pixels) to use for wrapping lines.
  }

  setFontSize(_fontSize) {
    // Sets the font size of this Game Object.
  }
  getBounds() {
    return { width: this.width, height: this.height };
  }

  setColor(_color) {
    // Sets the tint of this Game Object.
  }

  setShadowColor(_color) {
    // Sets the shadow color.
  }

  setTint(_color) {
    // Sets the tint of this Game Object.
  }

  setStrokeStyle(_thickness, _color) {
    // Sets the stroke style for the graphics.
    return this;
  }

  setDepth(_depth) {
    // Sets the depth of this Game Object.
  }

  setTexture(_texture) {
    // Sets the texture this Game Object will use to render with.
  }

  clearTint() {
    // Clears any previously set tint.
  }

  sendToBack() {
    // Sends this Game Object to the back of its parent's display list.
  }

  moveTo(_obj) {
    // Moves this Game Object to the given index in the list.
  }

  moveAbove(_obj) {
    // Moves this Game Object to be above the given Game Object in the display list.
  }

  moveBelow(_obj) {
    // Moves this Game Object to be below the given Game Object in the display list.
  }

  setName(name: string) {
    this.name = name;
  }

  bringToTop(_obj) {
    // Brings this Game Object to the top of its parents display list.
  }

  on(_event, _callback, _source) {}

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

  getByName(key: string) {
    return this.list.find(v => v.name === key) ?? new MockContainer(this.textureManager, 0, 0);
  }

  disableInteractive = () => null;

  each(method) {
    for (const item of this.list) {
      method(item);
    }
  }
}
