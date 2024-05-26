import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockRectangle extends MockContainer {
  private fillColor;
  private alpha;

  constructor(scene, x, y, width, height, fillColor) {
    super(scene, x, y, width, height);
    this.fillColor = fillColor;
  }
  setOrigin(x, y) {
    this.x = x;
    this.y = y;
  }
  setAlpha(alpha) {
    this.alpha = alpha;
  }
}
