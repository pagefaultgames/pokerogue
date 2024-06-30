import MockContainer from "#app/test/utils/mocks/mocksContainer/mockContainer";


export default class MockNineslice extends MockContainer {
  private texture;
  private leftWidth;
  private rightWidth;
  private topHeight;
  private bottomHeight;

  constructor(textureManager, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) {
    super(textureManager, x, y);
    this.texture = texture;
    this.frame = frame;
    this.leftWidth = leftWidth;
    this.rightWidth = rightWidth;
    this.topHeight = topHeight;
    this.bottomHeight = bottomHeight;
  }
}
