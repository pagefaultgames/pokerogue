import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockGraphics extends MockContainer {
  constructor(textureManager, config) {
    super(textureManager, config.x, config.y);
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
}
