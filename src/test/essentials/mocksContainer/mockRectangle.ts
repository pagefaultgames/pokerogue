import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockRectangle extends MockContainer {
  private fillColor;

  constructor(scene, x, y, width, height, fillColor) {
    super(scene, x, y);
    this.fillColor = fillColor;
  }
}
