import { MockContainer } from "#test/testUtils/mocks/mocksContainer/mockContainer";

export class MockPolygon extends MockContainer {
  constructor(textureManager, x, y, _content, _fillColor, _fillAlpha) {
    super(textureManager, x, y);
  }
}
