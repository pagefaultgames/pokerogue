import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockRectangle extends MockContainer {
  private fillColor;

  constructor(x, y, width, height, fillColor) {
    super(x, y);
    this.fillColor = fillColor;
  }
}
