export default class MockGraphics {
  private scene;
  public list = [];
  constructor(textureManager, config) {
    this.scene = textureManager.scene;
  }

  fillStyle(color) {
    // Sets the fill style to be used by the fill methods.
  }

  beginPath() {
    // Starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
  }

  fillRect(x, y, width, height) {
    // Adds a rectangle shape to the path which is filled when you call fill().
  }

  createGeometryMask() {
    // Creates a geometry mask.
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
    this.list = [];
  }

  setScale(scale) {
    // Sets the scale of this Game Object.
  }

  off(event, callback, source) {
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
