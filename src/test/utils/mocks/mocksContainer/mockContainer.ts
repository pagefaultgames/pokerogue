import MockTextureManager from "#app/test/utils/mocks/mockTextureManager";

export default class MockContainer {
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
  public list = [];

  constructor(textureManager: MockTextureManager, x, y) {
    this.x = x;
    this.y = y;
    this.frame = {};
    this.textureManager = textureManager;
  }
  setVisible(visible) {
    this.visible = visible;
  }

  once(event, callback, source) {
  }

  off(event, callback, source) {
  }

  removeFromDisplayList() {
    // same as remove or destroy
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
  }

  setSize(width, height) {
    // Sets the size of this Game Object.
  }

  setMask() {
    /// Sets the mask that this Game Object will use to render with.
  }

  setPositionRelative(source, x, y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
  }

  setInteractive(hitArea?, callback?, dropZone?) {
    /// Sets the InteractiveObject to be a drop zone for a drag and drop operation.
  }
  setOrigin(x, y) {
    this.x = x;
    this.y = y;
  }

  setAlpha(alpha) {
    this.alpha = alpha;
  }

  setFrame(frame, updateSize?: boolean, updateOrigin?: boolean) {
    // Sets the frame this Game Object will use to render with.
  }

  setScale(scale) {
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

  setShadow(shadowXpos, shadowYpos, shadowColor) {
    // Sets the shadow settings for this Game Object.
  }

  setLineSpacing(lineSpacing) {
    // Sets the line spacing value of this Game Object.
  }

  setText(text) {
    // Sets the text this Game Object will display.
  }

  setAngle(angle) {
    // Sets the angle of this Game Object.
  }

  setShadowOffset(offsetX, offsetY) {
    // Sets the shadow offset values.
  }

  setWordWrapWidth(width) {
    // Sets the width (in pixels) to use for wrapping lines.
  }

  setFontSize(fontSize) {
    // Sets the font size of this Game Object.
  }
  getBounds() {
    return { width: this.width, height: this.height };
  }

  setColor(color) {
    // Sets the tint of this Game Object.
  }

  setShadowColor(color) {
    // Sets the shadow color.
  }

  setTint(color) {
    // Sets the tint of this Game Object.
  }

  setStrokeStyle(thickness, color) {
    // Sets the stroke style for the graphics.
    return this;
  }

  setDepth(depth) {
    // Sets the depth of this Game Object.
  }

  setTexture(texture) {
    // Sets the texture this Game Object will use to render with.
  }

  clearTint() {
    // Clears any previously set tint.
  }

  sendToBack() {
    // Sends this Game Object to the back of its parent's display list.
  }

  moveAbove(obj) {
    // Moves this Game Object to be above the given Game Object in the display list.
  }

  moveBelow(obj) {
    // Moves this Game Object to be below the given Game Object in the display list.
  }

  setName(name) {
    // return this.phaserSprite.setName(name);
  }

  bringToTop(obj) {
    // Brings this Game Object to the top of its parents display list.
  }

  on(event, callback, source) {
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
