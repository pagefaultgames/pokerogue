import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockNineslice extends MockContainer {
  private texture;
  private frame;
  private leftWidth;
  private rightWidth;
  private topHeight;
  private bottomHeight;

  constructor(x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) {
    super(x, y, width, height);
    this.texture = texture;
    this.frame = frame;
    this.leftWidth = leftWidth;
    this.rightWidth = rightWidth;
    this.topHeight = topHeight;
    this.bottomHeight = bottomHeight;
  }
}
