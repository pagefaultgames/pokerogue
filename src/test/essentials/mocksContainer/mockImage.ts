import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockImage extends MockContainer {
  private texture;

  constructor(x, y, texture) {
    super(x, y);
    this.texture = texture;
  }
}
