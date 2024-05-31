export default class MockRectangle {
  private fillColor;
  private scene;

  constructor(textureManager, x, y, width, height, fillColor) {
    this.fillColor = fillColor;
    this.scene = textureManager.scene;
  }
  setOrigin(x, y) {
  }

  setAlpha(alpha) {
  }
  setVisible(visible) {
  }

  setName(name) {
  }

  once(event, callback, source) {
  }

  removeFromDisplayList() {
    // same as remove or destroy
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
  }

  setPositionRelative(source, x, y) {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
  }

  destroy() {

  }
}
