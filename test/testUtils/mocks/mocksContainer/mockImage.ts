import MockContainer from "#test/testUtils/mocks/mocksContainer/mockContainer";

export default class MockImage extends MockContainer {
  private texture;

  constructor(textureManager, x, y, texture) {
    super(textureManager, x, y);
    this.texture = texture;
  }
}
