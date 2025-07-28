import { MockContainer } from "#test/test-utils/mocks/mocks-container/mock-container";

export class MockNineslice extends MockContainer {
  private texture;
  private leftWidth;
  private rightWidth;
  private topHeight;
  private bottomHeight;

  constructor(textureManager, x, y, texture, frame, _width, _height, leftWidth, rightWidth, topHeight, bottomHeight) {
    super(textureManager, x, y);
    this.texture = texture;
    this.frame = frame;
    this.leftWidth = leftWidth;
    this.rightWidth = rightWidth;
    this.topHeight = topHeight;
    this.bottomHeight = bottomHeight;
  }
}
