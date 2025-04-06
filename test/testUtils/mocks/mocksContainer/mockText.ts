import UI from "#app/ui/ui";
import type { MockGameObject } from "../mockGameObject";

export default class MockText implements MockGameObject {
  private phaserText;
  private wordWrapWidth;
  private splitRegExp;
  private scene;
  private textureManager;
  public list: MockGameObject[] = [];
  public style;
  public text = "";
  public name: string;
  public color?: string;

  constructor(textureManager, _x, _y, _content, _styleOptions) {
    this.scene = textureManager.scene;
    this.textureManager = textureManager;
    this.style = {};
    // Phaser.GameObjects.TextStyle.prototype.setStyle = () => this;
    // Phaser.GameObjects.Text.prototype.updateText = () => null;
    // Phaser.Textures.TextureManager.prototype.addCanvas = () => {};
    UI.prototype.showText = this.showText;
    UI.prototype.showDialogue = this.showDialogue;
    this.text = "";
    this.phaserText = "";
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

  showText(
    text: string,
    delay?: number | null,
    callback?: Function | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    this.scene.messageWrapper.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
    if (callback) {
      callback();
    }
  }

  showDialogue(
    keyOrText: string,
    name: string | undefined,
    delay: number | null = 0,
    callback: Function,
    callbackDelay?: number,
    promptDelay?: number,
  ) {
    this.scene.messageWrapper.showDialogue(keyOrText, name, delay, callback, callbackDelay, promptDelay);
    if (callback) {
      callback();
    }
  }

  setScale(_scale) {
    // return this.phaserText.setScale(scale);
  }

  setShadow(_shadowXpos, _shadowYpos, _shadowColor) {
    // Sets the shadow settings for this Game Object.
    // return this.phaserText.setShadow(shadowXpos, shadowYpos, shadowColor);
  }

  setLineSpacing(_lineSpacing) {
    // Sets the line spacing value of this Game Object.
    // return this.phaserText.setLineSpacing(lineSpacing);
  }

  setOrigin(_x, _y) {
    // return this.phaserText.setOrigin(x, y);
  }

  once(_event, _callback, _source) {
    // return this.phaserText.once(event, callback, source);
  }

  off(_event, _callback, _obj) {}

  removedFromScene() {}

  addToDisplayList() {}

  setStroke(_color, _thickness) {
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

  setVisible(_visible) {
    // return this.phaserText.setVisible(visible);
  }

  setY(_y) {
    // return this.phaserText.setY(y);
  }

  setX(_x) {
    // return this.phaserText.setX(x);
  }

  /**
   * Sets the position of this Game Object.
   * @param x The x position of this Game Object. Default 0.
   * @param y The y position of this Game Object. If not set it will use the `x` value. Default x.
   * @param z The z position of this Game Object. Default 0.
   * @param w The w position of this Game Object. Default 0.
   */
  setPosition(_x?: number, _y?: number, _z?: number, _w?: number) {}

  setText(text) {
    // Sets the text this Game Object will display.
    // return this.phaserText.setText\(text);
    this.text = text;
  }

  setAngle(_angle) {
    // Sets the angle of this Game Object.
    // return this.phaserText.setAngle(angle);
  }

  setPositionRelative(_source, _x, _y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    // return this.phaserText.setPositionRelative(source, x, y);
  }

  setShadowOffset(_offsetX, _offsetY) {
    // Sets the shadow offset values.
    // return this.phaserText.setShadowOffset(offsetX, offsetY);
  }

  setWordWrapWidth(width) {
    // Sets the width (in pixels) to use for wrapping lines.
    this.wordWrapWidth = width;
  }

  setFontSize(_fontSize) {
    // Sets the font size of this Game Object.
    // return this.phaserText.setFontSize(fontSize);
  }

  getBounds() {
    // return this.phaserText.getBounds();
    return {
      width: 1,
    };
  }

  setColor(color: string) {
    this.color = color;
  }

  setInteractive = () => null;

  setShadowColor(_color) {
    // Sets the shadow color.
    // return this.phaserText.setShadowColor(color);
  }

  setTint(_color) {
    // Sets the tint of this Game Object.
    // return this.phaserText.setTint(color);
  }

  setStrokeStyle(_thickness, _color) {
    // Sets the stroke style for the graphics.
    // return this.phaserText.setStrokeStyle(thickness, color);
  }

  destroy() {
    // return this.phaserText.destroy();
    this.list = [];
  }

  setAlpha(_alpha) {
    // return this.phaserText.setAlpha(alpha);
  }

  setName(name: string) {
    this.name = name;
  }

  setAlign(_align) {
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

  disableInteractive() {
    // Disables interaction with this Game Object.
  }

  clearTint() {
    // Clears tint on this Game Object.
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

  /**
   * Runs the word wrap algorithm on the text, then returns an array of the lines
   */
  getWrappedText() {
    // Returns the wrapped text.
    // return this.phaserText.getWrappedText();
    return this.runWordWrap(this.text).split("\n");
  }

  on(_event: string | symbol, _fn: Function, _context?: any) {}
}
