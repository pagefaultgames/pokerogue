import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockNineslice extends MockContainer {
  private texture;
  private frame;
  private leftWidth;
  private rightWidth;
  private topHeight;
  private bottomHeight;

  constructor(scene, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) {
    super(scene, x, y);
    this.texture = texture;
    this.frame = frame;
    this.leftWidth = leftWidth;
    this.rightWidth = rightWidth;
    this.topHeight = topHeight;
    this.bottomHeight = bottomHeight;
  }
}
