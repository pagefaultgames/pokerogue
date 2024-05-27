import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockSprite extends MockContainer {
  public pipelineData;
  public texture;
  public key;
  constructor(x, y, texture) {
    super(x, y);
    this.pipelineData = {};
    this.texture = {
      key: "",
    };
  }
  stop() {

  }

  apply() {
    return this;
  }

  setPipeline(obj) {
    // Sets the pipeline of this Game Object.
    this.pipelineData = obj;
    return this;
  }

  on(event, callback, source) {
    // Adds an event listener for this Game Object.
  }

  setCrop(x, y, width, height) {
    // Sets the crop size of this Game Object.
  }

  disableInteractive() {
    // Disables Interactive features of this Game Object.
  }

}
