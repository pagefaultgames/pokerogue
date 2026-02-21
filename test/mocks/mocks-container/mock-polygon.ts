import { MockContainer } from "#test/mocks/mocks-container/mock-container";

export class MockPolygon extends MockContainer {
  constructor(textureManager, x, y, _content, _fillColor, _fillAlpha) {
    super(textureManager, x, y);
  }
}
