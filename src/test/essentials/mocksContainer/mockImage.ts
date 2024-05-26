import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockImage extends MockContainer {
  private texture;

  constructor(scene, x, y, texture) {
    super(scene, x, y);
    this.texture = texture;
  }
}
