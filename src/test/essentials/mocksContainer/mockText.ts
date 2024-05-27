import Phaser from "phaser";


export default class MockText {
  private phaserText;
  constructor(scene, x, y, content, styleOptions) {
    // super(scene, x, y);
    this.phaserText = new Phaser.GameObjects.Text(scene, x, y, content, styleOptions);
  }

  runWordWrap(text) {
    // Runs word wrap logic on the given text.
    if (!text) {
      return "";
    }
    return this.phaserText.runWordWrap(text);
  }

  setScale(scale) {
    return this.phaserText.setScale(scale);
  }

  setShadow(shadowXpos, shadowYpos, shadowColor) {
    // Sets the shadow settings for this Game Object.
    return this.phaserText.setShadow(shadowXpos, shadowYpos, shadowColor);
  }

  setLineSpacing(lineSpacing) {
    // Sets the line spacing value of this Game Object.
    return this.phaserText.setLineSpacing(lineSpacing);
  }

  setOrigin(x, y) {
    return this.phaserText.setOrigin(x, y);
  }

  once(event, callback, source) {
    return this.phaserText.once(event, callback, source);
  }

  removeFromDisplayList() {
    // same as remove or destroy
    return this.phaserText.removeFromDisplayList();
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
    return this.phaserText.addedToScene();
  }

  setVisible(visible) {
    return this.phaserText.setVisible(visible);
  }

  setY(y) {
    return this.phaserText.setY(y);
  }

  setX(x) {
    return this.phaserText.setX(x);
  }

  setText(text) {
    // Sets the text this Game Object will display.
    return this.phaserText.setText(text);
  }

  setAngle(angle) {
    // Sets the angle of this Game Object.
    return this.phaserText.setAngle(angle);
  }

  setPositionRelative(source, x, y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    return this.phaserText.setPositionRelative(source, x, y);
  }

  setShadowOffset(offsetX, offsetY) {
    // Sets the shadow offset values.
    return this.phaserText.setShadowOffset(offsetX, offsetY);
  }

  setWordWrapWidth(width) {
    // Sets the width (in pixels) to use for wrapping lines.
    return this.phaserText.setWordWrapWidth(width);
  }

  setFontSize(fontSize) {
    // Sets the font size of this Game Object.
    return this.phaserText.setFontSize(fontSize);
  }

  getBounds() {
    return this.phaserText.getBounds();
  }

  setColor(color) {
    // Sets the tint of this Game Object.
    return this.phaserText.setColor(color);
  }

  setShadowColor(color) {
    // Sets the shadow color.
    return this.phaserText.setShadowColor(color);
  }

  setTint(color) {
    // Sets the tint of this Game Object.
    return this.phaserText.setTint(color);
  }

  setStrokeStyle(thickness, color) {
    // Sets the stroke style for the graphics.
    return this.phaserText.setStrokeStyle(thickness, color);
  }

  destroy() {
    return this.phaserText.destroy();
  }
}
