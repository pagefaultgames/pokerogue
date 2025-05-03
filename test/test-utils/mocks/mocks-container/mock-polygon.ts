import MockContainer from "#test/test-utils/mocks/mocks-container/mock-container";

export default class MockPolygon extends MockContainer {
  constructor(textureManager, x, y, _content, _fillColor, _fillAlpha) {
    super(textureManager, x, y);
  }
}
