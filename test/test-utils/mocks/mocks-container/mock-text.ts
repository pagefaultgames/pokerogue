import type { MockGameObject } from "#test/test-utils/mocks/mock-game-object";
import type { TextInterceptor } from "#test/test-utils/text-interceptor";
import { UI } from "#ui/ui";

export class MockText implements MockGameObject {
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
  public active = true;

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

        // Skip printing the newline if it's the first word of the line that is greater
        // than the word wrap width.
        if (wordWidthWithSpace > spaceLeft && j > 0) {
          result += "\n";
          spaceLeft = this.wordWrapWidth;
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
    _delay?: number | null,
    callback?: Function | null,
    _callbackDelay?: number | null,
    _prompt?: boolean | null,
    _promptDelay?: number | null,
  ) {
    // TODO: this is a very bad way to pass calls around
    (this.scene.messageWrapper as TextInterceptor).showText(text);
    if (callback) {
      callback();
    }
  }

  showDialogue(
    keyOrText: string,
    name: string,
    _delay: number | null,
    callback: Function,
    _callbackDelay?: number,
    _promptDelay?: number,
  ) {
    (this.scene.messageWrapper as TextInterceptor).showDialogue(keyOrText, name);
    if (callback) {
      callback();
    }
  }

  setScale(_scale): this {
    // return this.phaserText.setScale(scale);
    return this;
  }

  setShadow(_shadowXpos, _shadowYpos, _shadowColor): this {
    // Sets the shadow settings for this Game Object.
    // return this.phaserText.setShadow(shadowXpos, shadowYpos, shadowColor);
    return this;
  }

  setLineSpacing(_lineSpacing): this {
    // Sets the line spacing value of this Game Object.
    // return this.phaserText.setLineSpacing(lineSpacing);
    return this;
  }

  setOrigin(_x, _y): this {
    // return this.phaserText.setOrigin(x, y);
    return this;
  }

  once(_event, _callback, _source): this {
    // return this.phaserText.once(event, callback, source);
    return this;
  }

  off(_event, _callback, _obj) {}

  removedFromScene() {}

  addToDisplayList(): this {
    return this;
  }

  setStroke(_color, _thickness): this {
    // Sets the stroke color and thickness.
    // return this.phaserText.setStroke(color, thickness);
    return this;
  }

  removeFromDisplayList(): this {
    // same as remove or destroy
    // return this.phaserText.removeFromDisplayList();
    return this;
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
    // return this.phaserText.addedToScene();
  }

  setVisible(_visible): this {
    return this;
  }

  setY(_y): this {
    // return this.phaserText.setY(y);
    return this;
  }

  setX(_x): this {
    // return this.phaserText.setX(x);
    return this;
  }

  /**
   * Sets the position of this Game Object.
   * @param x The x position of this Game Object. Default 0.
   * @param y The y position of this Game Object. If not set it will use the `x` value. Default x.
   * @param z The z position of this Game Object. Default 0.
   * @param w The w position of this Game Object. Default 0.
   */
  setPosition(_x?: number, _y?: number, _z?: number, _w?: number): this {
    return this;
  }

  setText(text): this {
    // Sets the text this Game Object will display.
    // return this.phaserText.setText\(text);
    this.text = text;
    return this;
  }

  setAngle(_angle): this {
    // Sets the angle of this Game Object.
    // return this.phaserText.setAngle(angle);
    return this;
  }

  setPositionRelative(_source, _x, _y): this {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    // return this.phaserText.setPositionRelative(source, x, y);
    return this;
  }

  setShadowOffset(_offsetX, _offsetY): this {
    // Sets the shadow offset values.
    // return this.phaserText.setShadowOffset(offsetX, offsetY);
    return this;
  }

  setWordWrapWidth(width): this {
    // Sets the width (in pixels) to use for wrapping lines.
    this.wordWrapWidth = width;
    return this;
  }

  setFontSize(_fontSize): this {
    // Sets the font size of this Game Object.
    // return this.phaserText.setFontSize(fontSize);
    return this;
  }

  getBounds() {
    // return this.phaserText.getBounds();
    return {
      width: 1,
    };
  }

  setColor(color: string): this {
    this.color = color;
    return this;
  }

  setInteractive(): this {
    return this;
  }

  setShadowColor(_color): this {
    // Sets the shadow color.
    // return this.phaserText.setShadowColor(color);
    return this;
  }

  setTint(_color): this {
    // Sets the tint of this Game Object.
    // return this.phaserText.setTint(color);
    return this;
  }

  setStrokeStyle(_thickness, _color): this {
    // Sets the stroke style for the graphics.
    // return this.phaserText.setStrokeStyle(thickness, color);
    return this;
  }

  destroy() {
    // return this.phaserText.destroy();
    this.list = [];
  }

  setAlpha(_alpha): this {
    // return this.phaserText.setAlpha(alpha);
    return this;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setAlign(_align): this {
    // return this.phaserText.setAlign(align);
    return this;
  }

  setMask(): this {
    /// Sets the mask that this Game Object will use to render with.
    return this;
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

  disableInteractive(): this {
    // Disables interaction with this Game Object.
    return this;
  }

  clearTint(): this {
    // Clears tint on this Game Object.
    return this;
  }

  add(obj): this {
    // Adds a child to this Game Object.
    this.list.push(obj);
    return this;
  }

  removeAll(): this {
    // Removes all Game Objects from this Container.
    this.list = [];
    return this;
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

  getIndex(obj): number {
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

  // biome-ignore lint/complexity/noBannedTypes: This matches the signature of the class this mocks
  on(_event: string | symbol, _fn: Function, _context?: any) {}

  setActive(_active: boolean): this {
    return this;
  }
}
