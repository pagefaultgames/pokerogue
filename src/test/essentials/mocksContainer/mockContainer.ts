export default class MockContainer {
  protected x;
  protected y;
  protected scene;
  protected width;
  protected height;
  protected visible;

  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  setVisible(visible) {
    this.visible = visible;
  }

  once(event, callback, source) {
  }

  removeFromDisplayList() {
    // same as remove or destroy
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
  }

}
