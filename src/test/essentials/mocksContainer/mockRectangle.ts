import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockRectangle extends MockContainer {
  private fillColor;

  constructor(textureManager, x, y, width, height, fillColor) {
    super(textureManager, x, y);
    this.fillColor = fillColor;
  }
}
