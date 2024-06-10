import UI from "#app/ui/ui";

export default class MockText {
  private phaserText;
  private wordWrapWidth;
  private splitRegExp;
  private scene;
  private textureManager;
  public list = [];
  public style;

  constructor(textureManager, x, y, content, styleOptions) {
    this.scene = textureManager.scene;
    this.textureManager = textureManager;
    this.style = {};
    // Phaser.GameObjects.TextStyle.prototype.setStyle = () => null;
    // Phaser.GameObjects.Text.prototype.updateText = () => null;
    // Phaser.Textures.TextureManager.prototype.addCanvas = () => {};
    UI.prototype.showText = this.showText;
    // super(scene, x, y);
    // this.phaserText = new Phaser.GameObjects.Text(scene, x, y, content, styleOptions);
  }

  runWordWrap(text) {
    if (!text) {
      return "";
    }
    let result = "";
    this.splitRegExp = /(?:\r\n|\r|\n)/;
    const lines = text.split(this.splitRegExp);
    const lastLineIndex = lines.length - 1;
    const whiteSpaceWidth = 2;

    for (let i = 0; i <= lastLineIndex; i++) {
      let spaceLeft = this.wordWrapWidth;
      const words = lines[i].split(" ");
      const lastWordIndex = words.length - 1;

      for (let j = 0; j <= lastWordIndex; j++) {
        const word = words[j];
        const wordWidth = word.length * 2;
        let wordWidthWithSpace = wordWidth;

        if (j < lastWordIndex) {
          wordWidthWithSpace += whiteSpaceWidth;
        }

        if (wordWidthWithSpace > spaceLeft) {
          // Skip printing the newline if it's the first word of the line that is greater
          // than the word wrap width.
          if (j > 0) {
            result += "\n";
            spaceLeft = this.wordWrapWidth;
          }
        }

        result += word;

        if (j < lastWordIndex) {
          result += " ";
          spaceLeft -= wordWidthWithSpace;
        } else {
          spaceLeft -= wordWidth;
        }
      }

      if (i < lastLineIndex) {
        result += "\n";
      }
    }

    return result;
  }

  showText(text, delay, callback, callbackDelay, prompt, promptDelay) {
    this.scene.messageWrapper.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
    if (callback) {
      callback();
    }
  }

  setScale(scale) {
    // return this.phaserText.setScale(scale);
  }

  setShadow(shadowXpos, shadowYpos, shadowColor) {
    // Sets the shadow settings for this Game Object.
    // return this.phaserText.setShadow(shadowXpos, shadowYpos, shadowColor);
  }

  setLineSpacing(lineSpacing) {
    // Sets the line spacing value of this Game Object.
    // return this.phaserText.setLineSpacing(lineSpacing);
  }

  setOrigin(x, y) {
    // return this.phaserText.setOrigin(x, y);
  }

  once(event, callback, source) {
    // return this.phaserText.once(event, callback, source);
  }

  off(event, callback, obj) {
  }

  removedFromScene() {

  }

  addToDisplayList() {

  }

  setStroke(color, thickness) {
    // Sets the stroke color and thickness.
    // return this.phaserText.setStroke(color, thickness);
  }

  removeFromDisplayList() {
    // same as remove or destroy
    // return this.phaserText.removeFromDisplayList();
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
    // return this.phaserText.addedToScene();
  }

  setVisible(visible) {
    // return this.phaserText.setVisible(visible);
  }

  setY(y) {
    // return this.phaserText.setY(y);
  }

  setX(x) {
    // return this.phaserText.setX(x);
  }

  /**
   * Sets the position of this Game Object.
   * @param x The x position of this Game Object. Default 0.
   * @param y The y position of this Game Object. If not set it will use the `x` value. Default x.
   * @param z The z position of this Game Object. Default 0.
   * @param w The w position of this Game Object. Default 0.
   */
  setPosition(x?: number, y?: number, z?: number, w?: number) { }

  setText(text) {
    // Sets the text this Game Object will display.
    // return this.phaserText.setText(text);
  }

  setAngle(angle) {
    // Sets the angle of this Game Object.
    // return this.phaserText.setAngle(angle);
  }

  setPositionRelative(source, x, y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    // return this.phaserText.setPositionRelative(source, x, y);
  }

  setShadowOffset(offsetX, offsetY) {
    // Sets the shadow offset values.
    // return this.phaserText.setShadowOffset(offsetX, offsetY);
  }

  setWordWrapWidth(width) {
    // Sets the width (in pixels) to use for wrapping lines.
    this.wordWrapWidth = width;
  }

  setFontSize(fontSize) {
    // Sets the font size of this Game Object.
    // return this.phaserText.setFontSize(fontSize);
  }

  getBounds() {
    // return this.phaserText.getBounds();
    return {
      width: 1,
    };
  }

  setColor(color) {
    // Sets the tint of this Game Object.
    // return this.phaserText.setColor(color);
  }

  setShadowColor(color) {
    // Sets the shadow color.
    // return this.phaserText.setShadowColor(color);
  }

  setTint(color) {
    // Sets the tint of this Game Object.
    // return this.phaserText.setTint(color);
  }

  setStrokeStyle(thickness, color) {
    // Sets the stroke style for the graphics.
    // return this.phaserText.setStrokeStyle(thickness, color);
  }

  destroy() {
    // return this.phaserText.destroy();
    this.list = [];
  }

  setAlpha(alpha) {
    // return this.phaserText.setAlpha(alpha);
  }

  setName(name) {
    // return this.phaserText.setName(name);
  }

  setAlign(align) {
    // return this.phaserText.setAlign(align);
  }

  setMask() {
    /// Sets the mask that this Game Object will use to render with.
  }

  getBottomLeft() {
    return {
      x: 0,
      y: 0,
    };
  }

  getTopLeft() {
    return {
      x: 0,
      y: 0,
    };
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
