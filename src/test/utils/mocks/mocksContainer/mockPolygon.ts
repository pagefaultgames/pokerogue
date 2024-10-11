import MockContainer from "#app/test/utils/mocks/mocksContainer/mockContainer";


export default class MockPolygon extends MockContainer {
  constructor(textureManager, x, y, content, fillColor, fillAlpha) {
    super(textureManager, x, y);
  }
}

